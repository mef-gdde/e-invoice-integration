import dataSource from "../database/dataSource";
import paginate from "../repository/pagination";
import { CLIENT_ID, CLIENT_SECRET, INVOICE_API_URL } from "../config";
import { InvoiceClient } from "../lib/invoice.client";
import { Invoice } from "../entities/invoice.entity";
import { AllowanceCharge, Invoice as InvoiceDto, Merchant} from '../interface/Invoice'
import { VAT } from "../product";
import { ProductService } from "./product.service";
import moment from 'moment'
import { PaginationService } from "./pagination.service";
import { InvoiceLine, TaxCategory, TaxSubtotal } from "../interface/Invoice";
import { DocumentType } from "../enums/DocumentType";
import fs from 'fs'
import path from 'path'
import handlebars from "./handlebar";
import { InvoiceType } from "../enums/InvoiceType";
import { NotFoundException } from "../exception/NotFoundException";
import customers from "../customer";
import { ClientSecretKey } from "../entities/client-credential.entity";

export class InvoiceService {
    private clientSecretKeyRepository = dataSource.getRepository(ClientSecretKey)
    private readonly invoiceRepository = dataSource.getRepository(Invoice).extend(paginate)
    private readonly paginationService = new PaginationService()
    private invoiceClient: InvoiceClient;
    private readonly productService = new ProductService();
    private static ublTemplate = {
        [DocumentType.INVOICE]: '../views/invoiceUBL.hbs',
        [DocumentType.DEBIT_NOTE]: '../views/debit-note-ubl.hbs',
        [DocumentType.CREDIT_NOTE]: '../views/credit-note-ubl.hbs'
    }
    
    private static InvoiceTypeCode = {
        [InvoiceType.TAX_INVOICE]: 388,
        [InvoiceType.COMMERCIAL_INVOICE]: 380
    }


    constructor() {
        this.invoiceClient = new InvoiceClient({
            client_id: CLIENT_ID,
            api_url: INVOICE_API_URL,
            secret_key: CLIENT_SECRET
        })
    }

    async prepareInvoiceData(data: any) {
        let subTotal = 0;
        const invoiceLines = data.invoice_lines.map((invoiceLine: any) => {
            const product = this.productService.find(invoiceLine.id)
            const line_extension_amount = product.price * invoiceLine.quantity
            
            let vatBase = line_extension_amount
            let totalTax = 0;
            const taxes = product.tax_categories.map((tax) => {
                if (tax.tax_scheme != VAT.tax_scheme) {
                    tax.tax_amount = line_extension_amount * tax.percent / 100
                    vatBase += tax.tax_amount
                } else {
                    tax.tax_amount = vatBase * tax.percent / 100.0
                }

                totalTax += tax.tax_amount
                return { ...tax};
            })
            subTotal += line_extension_amount;
       
            return {
                id: product.id,
                quantity: invoiceLine.quantity,
                quantity_unit_code: 'XBF',
                line_extension_amount: line_extension_amount,
                price: product.price,
                item: {
                  description: product?.description,
                  name: product.name,
                  tax_categories: taxes
                }
              }
        })

        const supplier = await this.clientSecretKeyRepository.findOneBy({ id: undefined })
        return {
            document_number: new Date().getTime(),
            issue_date: moment().format('YYYY-MM-DD'),
            currency: "USD",
            due_date: moment().add(2, 'months').format('YYYY-MM-DD'),
            buyer: {
                vatin: data.buyer_vat_tin
            },
            sub_total: subTotal,
            invoice_type_code: InvoiceService.InvoiceTypeCode[InvoiceType.TAX_INVOICE],
            customer: this.formatBuyer(customers[0]),
            supplier: this.formatBuyer(supplier),
            invoice_lines: invoiceLines
         }
    }


    async createInvoice(invoiceData: any) {
       try {
        await this.invoiceClient.generateAccessToken()
        invoiceData = await this.prepareInvoiceData(invoiceData)
        
        this.fillInvoiceInformation(invoiceData)
        const ubl = this.generateUBL(invoiceData)
        const response = await this.invoiceClient.createInvoice(ubl)
        const invoice = response.data[0]
        const gettingInvoice = await this.invoiceClient.getInvoice(invoice.document_id)
        gettingInvoice.verification_link = invoice.verification_link
        const mergeInvoice = await this.invoiceRepository.merge(gettingInvoice)
        return await this.invoiceRepository.save(mergeInvoice)
       } catch (e: any) {
        throw e
       }
       throw new NotFoundException('Not found')
    }

    async list(page = 1, params: any = {}) {
        const query = await this.invoiceRepository.createQueryBuilder()
            .where(params)
            .orderBy('updated_at', 'DESC')
        
        return await this.paginationService.getPagination(page, 10, query)
    }

    async download(invoiceID: string) {
        await this.invoiceClient.generateAccessToken()
        await this.invoiceClient.downloadPdf(invoiceID)
    }

    // async sendInvoice(invoiceID: string) {
    //     const invoice = await this.invoiceRepository.findOneByOrFail({ invoice_id: invoiceID })
    //     await this.invoiceClient.generateAccessToken()
    //     await this.invoiceClient.sendInvoice(invoiceID)
    //     invoice.status = 'SENT'
    //     await this.invoiceRepository.save(invoice)
    // }

    public fillInvoiceInformation (invoice: Partial<InvoiceDto>) {
        let taxCategorySubTotal: Record<string, TaxSubtotal> = {}
        let totalExtensionAmount = 0;
        let totalVatExclusiveAmount = 0;
        let allowanceChargeTotal = {
            charges: 0,
            allowances: 0
        }

        invoice.invoice_lines?.map((line) => {
            totalExtensionAmount += line.line_extension_amount;
            let vatExclusiveAmount = line.line_extension_amount;
            line.tax_total = {
                tax_amount: 0,
                tax_subtotals: []
            }

            if (line?.item?.tax_categories) {
                this.calculateTaxSubtotal(taxCategorySubTotal, line.item.tax_categories);
            }

            let vatTax: TaxCategory | null = null
            for (let taxCategory of line?.item?.tax_categories || []) {
                totalVatExclusiveAmount += taxCategory.tax_amount;
                if (taxCategory.tax_scheme !== 'VAT') {
                    this.applyTaxOnItem(line, taxCategory.tax_amount, taxCategory)
                    vatExclusiveAmount += taxCategory.tax_amount;
                } else {
                    vatTax = taxCategory
                }
            }

            if (vatTax) {
                this.applyTaxOnItem(line, vatExclusiveAmount * vatTax.percent / 100, vatTax)
            }

            if (line.vat_exclusive_amount !== undefined) {
                line.vat_exclusive_amount = vatExclusiveAmount;
            }

            if (line.tax_inclusive_amount !== undefined) {
                line.tax_inclusive_amount = vatExclusiveAmount;
            }

            totalVatExclusiveAmount += vatExclusiveAmount;
        })

        if (invoice.allowance_charges) {
            this.calculateAllowanceCharges(allowanceChargeTotal, taxCategorySubTotal, invoice.allowance_charges);
        }

        let taxSubtotals: TaxSubtotal[] = [];
        let taxAmount = 0;
        let taxableAmount = totalExtensionAmount;

        for (let key in taxCategorySubTotal) {
            taxAmount += taxCategorySubTotal[key].tax_amount;
            taxSubtotals.push(taxCategorySubTotal[key]);
        }

        invoice.tax_total = {
            tax_amount: taxAmount,
            tax_subtotals: taxSubtotals
        }

        invoice.legal_monetary_total = {
            line_extension_amount: totalExtensionAmount,
            tax_exclusive_amount: taxableAmount + allowanceChargeTotal.charges - allowanceChargeTotal.allowances,
            tax_inclusive_amount: taxableAmount + allowanceChargeTotal.charges - allowanceChargeTotal.allowances + taxAmount,
            payable_amount: taxableAmount + allowanceChargeTotal.charges - allowanceChargeTotal.allowances + taxAmount - (invoice.prepaid_payment?.paid_amount ?? 0),
            charge_total_amount: allowanceChargeTotal.charges ?  allowanceChargeTotal.charges : undefined,
            prepaid_amount: invoice.prepaid_payment?.paid_amount ?? undefined,
            allowance_total_amount: allowanceChargeTotal.allowances ? allowanceChargeTotal.allowances : undefined,

        }
    }

    private applyTaxOnItem(line: InvoiceLine, amount: number, taxCategory: TaxCategory) {
        if (! line.tax_total) {
            line.tax_total = {
                tax_amount: 0,
                tax_subtotals: []
            }
        }
        line.tax_total.tax_amount += amount;
        line.tax_total?.tax_subtotals.push({
            tax_amount: taxCategory.tax_amount,
            tax_category: taxCategory,
        })
    }

    private calculateTaxSubtotal(taxCategorySubTotal: Record<string, TaxSubtotal>, taxCategories: TaxCategory[] | undefined) {
        if (! taxCategories) return;

        for (let taxCategory of taxCategories) {
            let key = `${taxCategory.id}-${taxCategory.percent}-${taxCategory.tax_scheme}`;

            if (! taxCategorySubTotal[key]) {
                taxCategorySubTotal[key] = {
                    tax_amount: 0,
                    taxable_amount: 0,
                    tax_category: taxCategory
                };
            }

            //Avoid dividing by 0
            if (taxCategory.percent === 0) {
                taxCategorySubTotal[key].taxable_amount = 0;
            } else {
                taxCategorySubTotal[key].taxable_amount! += taxCategory.tax_amount / (taxCategory.percent / 100);
            }

            taxCategorySubTotal[key].tax_amount += taxCategory.tax_amount;
        }
    }

    public generateUBL(invoice: Partial<InvoiceDto>, documentType: DocumentType = DocumentType.INVOICE) {
        try {
            const templateSource = fs.readFileSync(path.join(__dirname, InvoiceService.ublTemplate[documentType]), 'utf8');
            const template = handlebars.compile(templateSource);
            const xmlDocument = template(invoice);
           
            return xmlDocument;
        } catch (err: any) {
            throw new Error('Failed in GenerateUBL utility');
        }
    }

    private calculateAllowanceCharges(allowanceChargeTotal: { charges: number; allowances: number; }, taxCategorySubtotals: Record<string, TaxSubtotal>, allowanceCharges: AllowanceCharge[]) {
        for (let allowanceCharge  of allowanceCharges) {
            if (allowanceCharge.charge_indicator) {
                allowanceChargeTotal.charges += allowanceCharge.amount;
            } else {
                allowanceChargeTotal.allowances += allowanceCharge.amount;
            }

            if (allowanceCharge.tax_categories) {
                this.calculateTaxSubtotal(taxCategorySubtotals, allowanceCharge.tax_categories);
            }
        }
    }

    public formatBuyer(buyer: any): Merchant {
        return {
            name: buyer.name,
            postal_address: {
              city_name: buyer.city,
              country_code: buyer.country_code || "KH",
              street_name: buyer.street_name,
            },
            party_tax_scheme: {
              company_id: buyer.tin,
              tax_scheme: "VAT"
            },
            party_legal_entity: {
              registration_name_en: buyer.company_name_en,
              registration_name_kh: buyer.company_name_kh,
              company_id: buyer.moc_id
            },
            contact: {
              name: buyer.company_name_en,
              phone: buyer.phone_number,
              email: buyer.email
            },
          }
        return {
          name: buyer.name,
          postal_address: {
            city_name: buyer.city,
            country_code: buyer.country_code || "KH",
            street_name: buyer.street_name,
          },
          party_tax_scheme: {
            company_id: buyer.vatin,
            tax_scheme: "VAT"
          },
          party_legal_entity: {
            registration_name_en: buyer.company_name_en,
            registration_name_kh: buyer.company_name_kh,
            company_id: buyer.moc_id
          },
          contact: {
            name: buyer.company_name_en,
            phone: buyer.phone_number,
            email: buyer.email
          },
        }
     
      }

   
}
import dataSource from "../database/dataSource";
import paginate from "../repository/pagination";
import { CLIENT_ID, CLIENT_SECRET, INVOICE_API_URL } from "../config";
import { InvoiceClient } from "../lib/invoice.client";
import { ProductService } from "./product.service";
import { PaginationService } from "./pagination.service";
import { InvoiceReceived } from "../entities/invoice-received.entity";
import { eventEmitter } from "../lib/EventEmitter";
import { AppEvent } from "../enums/AppEvent";
import { AcceptInvoiceDto } from "../dto/accept-invoice.dto";

export class InvoiceReceivedService {
    private readonly invoiceRepository = dataSource.getRepository(InvoiceReceived).extend(paginate)
    private readonly paginationService = new PaginationService()
    private invoiceClient: InvoiceClient;

    constructor() {
        this.invoiceClient = new InvoiceClient({
            client_id: CLIENT_ID,
            api_url: INVOICE_API_URL,
            secret_key: CLIENT_SECRET
        })
    }

    async saveReceivedInvoice(invoice: any) {
        try {
            await this.invoiceClient.generateAccessToken()
            const gettingInvoice = await this.invoiceClient.getInvoice(invoice.document_id)
            gettingInvoice.verification_link = invoice.verification_link
            const mergeInvoice = await this.invoiceRepository.merge(gettingInvoice)
            eventEmitter.emit(AppEvent.INVOICE_RECEIVED, mergeInvoice)
            
            return await this.invoiceRepository.save(mergeInvoice)
        } catch (e) {
            console.log('invalid invoice from webhook', e)
        }
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

    async rejectInvoice(document: AcceptInvoiceDto) {
        return await this.invoiceClient.acceptDocument(document.document_id)
    }

    async acceptInvoice(document: AcceptInvoiceDto) {
        return await this.invoiceClient.rejectDocument(document.document_id)
    }
}
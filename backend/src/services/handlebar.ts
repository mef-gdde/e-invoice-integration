import path from "path";
import fs from 'fs'
import handlebars from 'handlebars';

const partialsDir = path.join(__dirname, '../views/partials/');
const accountingSupplierPartyPartial = fs.readFileSync(partialsDir + 'accountingSupplierParty.hbs', 'utf8');
const accountingCustomerPartyPartial = fs.readFileSync(partialsDir + 'accountingCustomerParty.hbs', 'utf8');
const allowanceChargePartial = fs.readFileSync(partialsDir + 'allowanceCharge.hbs', 'utf8');
const paymentMeansPartial = fs.readFileSync(partialsDir + 'paymentMeans.hbs', 'utf8');
const taxTotalPartial = fs.readFileSync(partialsDir + 'taxTotal.hbs', 'utf-8');
const legalMonetaryTotalPartial = fs.readFileSync(partialsDir + 'legalMonetaryTotal.hbs', 'utf-8');
const invoiceLinePartial = fs.readFileSync(partialsDir + 'invoiceLine.hbs', 'utf-8');

const debitNoteLine = fs.readFileSync(partialsDir + 'debitNoteLine.hbs', 'utf-8');
const creditNoteLine = fs.readFileSync(partialsDir + 'creditNoteLine.hbs', 'utf-8');
const orderReference = fs.readFileSync(partialsDir + 'orderReference.hbs', 'utf-8');

// Register the partials to handlebars
handlebars.registerPartial('accountingSupplierParty', accountingSupplierPartyPartial);
handlebars.registerPartial('accountingCustomerParty', accountingCustomerPartyPartial);
handlebars.registerPartial('allowanceCharge', allowanceChargePartial);
handlebars.registerPartial('paymentMeans', paymentMeansPartial);
handlebars.registerPartial('taxTotal', taxTotalPartial);
handlebars.registerPartial('legalMonetaryTotal', legalMonetaryTotalPartial);
handlebars.registerPartial('invoiceLine', invoiceLinePartial);

handlebars.registerPartial('debitNoteLine', debitNoteLine);
handlebars.registerPartial('creditNoteLine', creditNoteLine);
handlebars.registerPartial('orderReference', orderReference);
handlebars.registerPartial('prepaidPayment', fs.readFileSync(partialsDir + 'prepaidPayment.hbs', 'utf-8'));
handlebars.registerPartial('taxExchangeRate', fs.readFileSync(partialsDir + 'taxExchangeRate.hbs', 'utf-8'));
handlebars.registerPartial('requestedMonetaryTotal', fs.readFileSync(partialsDir + 'requestedMonetaryTotal.hbs', 'utf-8'));
handlebars.registerPartial('note', fs.readFileSync(partialsDir + 'note.hbs', 'utf-8'));
handlebars.registerHelper('eq', (a, b) => a == b)
export default handlebars;
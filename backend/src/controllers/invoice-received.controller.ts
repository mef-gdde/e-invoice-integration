import { Request, Response } from "express";
import { ErrorHandlingWrapper } from "../decorator/ErrorHandlingWrapper";
import { BaseController } from "./base.controller";
import { InvoiceReceivedService } from "../services/invoice-received.service";
import { InvoiceReceivedDto } from "../dto/invoice-received.dto";
import { ValidateBody } from "../decorator/ValidateBody";
import { InvoiceEventType } from "../enums/InvoiceEventType";
import { SendTo } from "../decorator/SendTo";
import path from "path";
import fs from 'fs'
import { AcceptInvoiceDto } from "../dto/accept-invoice.dto";

export class InvoiceReceiveController extends BaseController {
    private readonly invoiceService = new InvoiceReceivedService()

    @ErrorHandlingWrapper
    @ValidateBody(InvoiceReceivedDto)
    async receiveInvoice(receivedEvent: InvoiceReceivedDto) {
        switch (receivedEvent.event_type) {
            case InvoiceEventType.INVOICE_CREATED:
                await this.invoiceService.saveReceivedInvoice(receivedEvent);
        }

        return {
            success: true,
            message: 'Event handled'
        }
    }

    @ErrorHandlingWrapper
    @SendTo
    async list(req: Request, Res: Response) {
        const invoice = await this.invoiceService.list(Number(req.query.page || 1), { });
        return invoice
    }

    @ErrorHandlingWrapper
    @ValidateBody(AcceptInvoiceDto)
    async acceptInvoice(document: AcceptInvoiceDto) {
        
        return this.invoiceService.acceptInvoice(document)
    }

    @ErrorHandlingWrapper
    @ValidateBody(AcceptInvoiceDto)
    async rejectInvoice(document: AcceptInvoiceDto) {
        return this.invoiceService.rejectInvoice(document)
    }

    @ErrorHandlingWrapper
    async downloadPdf(req: Request, res: Response) {
        const pdfFilePath = path.join(__dirname, '../../invoice-pdf/'+req.params.invoice_id + '.pdf');

        // Check if the file exists
        if (! fs.existsSync(pdfFilePath)) {
            await this.invoiceService.download(req.params.invoice_id)
        }

        // Set the appropriate headers for the response
        res.setHeader('Content-disposition', 'attachment; filename=file.pdf');
        res.setHeader('Content-type', 'application/pdf');

        // Send the PDF file
        const stream = fs.createReadStream(pdfFilePath);
        stream.pipe(res);
    }

}

export default new InvoiceReceiveController
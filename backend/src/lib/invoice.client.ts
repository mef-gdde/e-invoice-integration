import axios, { Axios, AxiosInstance } from "axios";
import { CLIENT_ID, CLIENT_SECRET, INVOICE_API_URL } from "../config";
import fs from 'fs'
import { DocumentType } from "../enums/DocumentType";
import dataSource from "../database/dataSource";
import { ClientSecretKey } from "../entities/client-credential.entity";
import moment, { Moment } from "moment";

export interface InvoiceClientOption {
    client_id: string;
    secret_key: string;
    api_url: string
}

export class InvoiceClient {
    private axios: AxiosInstance;
    private invoiceOption: InvoiceClientOption;
    private accessToken: string;
    private accessTokenExpireAt: Moment | null = null;
    private clientSecretKeyRepository = dataSource.getRepository(ClientSecretKey)

    constructor(option: InvoiceClientOption) {
        this.axios = axios.create({ baseURL:  option.api_url })
        this.invoiceOption = option
    }

    async generateAccessToken() {
        if ( !(this.accessTokenExpireAt && this.accessTokenExpireAt.isAfter(moment()))) {
            try {
                const credential = (await this.clientSecretKeyRepository.find({}))[0]        

                const basic = 'Basic ' + Buffer.from(CLIENT_ID + ':' + CLIENT_SECRET).toString('base64')
    
                const result = await this.axios.post('/auth/token', {
                    refresh_token: credential?.refresh_token
                }, {
                    headers: {
                        Authorization: basic
                    }
                })
    
                this.accessToken = result.data.access_token
                this.accessTokenExpireAt = moment(result.data.expire_at)
    
            } catch (e: any) {
                console.log('error==>', e.response)
                throw e
            }
        }
    }

    async createInvoice(invoice: any) {
        return await this.axios.post('/document', {
            documents: [
                {
                    document_type: DocumentType.INVOICE,
                    document: Buffer.from(invoice).toString('base64')
                }
            ]
        }, { headers: {
            'Authorization': `Bearer ${this.accessToken}`
        }})
    }

    async getInvoice(invoiceID: string) {
        const result = await this.axios.get(`document/${invoiceID}`, {
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
        })

        return result.data
    }

    async downloadPdf(invoiceID: string) {
          return await this.axios({
            method: 'get',
            url: `/document/${invoiceID}/pdf`,
            responseType: 'stream',
            headers: {
                'Authorization': `Bearer ${this.accessToken}`
            }
          })
            .then((response) => {
              const writer = fs.createWriteStream(`invoice-pdf/${invoiceID}.pdf`); 
              response.data.pipe(writer);
          
              return new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
              });
            })
            .then(() => {
              console.log('PDF downloaded successfully');
            })
            .catch((error) => {
              console.error('Error downloading PDF:', error);
        });
    }

    // async sendInvoice(invoiceID: string) {
    //     return await this.axios.post(`/invoice/send/${invoiceID}`, {}, { headers: {
    //         'Authorization': `Bearer ${this.accessToken}`
    //     }})
    // }

    async rejectDocument(documentID: string) {
        const result = await this.axios.post('/document/reject', {
            documents: [documentID]
        })

        if (result.data.rejected_documents.length > 0) {
            return true
        }

        return false
    }

    async acceptDocument(documentID: string) {
        const result = await this.axios.post('/document/accept', {
            documents: [documentID]
        })

        if (result.data.accepted_documents.length > 0) {
            return true
        }

        return false
    }
}
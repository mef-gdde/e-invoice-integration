import { Entity, Column, PrimaryGeneratedColumn, PrimaryColumn, CreateDateColumn, UpdateDateColumn, OneToOne, JoinColumn, AfterLoad, Index } from 'typeorm';
import { DocumentType } from '../enums/DocumentType';
import moment from 'moment';
import { InvoiceType } from '../enums/InvoiceType';
interface AttestedDocument {
    version: string,
    data: {
        document: string,
        '$template': any,
        issuers: any
    },
    signature: {
        type: string,
        targetHash: string,
        proof: [],
        merkleRoot: string
    }
}

@Entity('invoice1')
export class Invoice {
    @PrimaryColumn()
    document_id: string;

    @Column({ nullable: true })
    document_number: string;
    
    @Column({ default: InvoiceType.TAX_INVOICE, length: 20 })
    invoice_type: InvoiceType;

    @Column()
    @Index()
    supplier_id: string;

    @Column({ nullable: true })
    supplier_company_name_kh: string;

    @Column({ nullable: true })
    supplier_company_name_en: string;

    @Column()
    supplier_vattin: string;

    @Column({ nullable: true })
    @Index()
    customer_id: string;

    @Column({ nullable: true })
    customer_company_name_en: string;

    @Column({ nullable: true })
    customer_company_name_kh: string;

    @Column()
    customer_vattin: string;

    @Column()
    issue_date: Date;

    @Column({ nullable: true })
    due_date: Date;

    @Column()
    pdf_file: string

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn() 
    updated_at: Date;

    @Column({ nullable: true })
    xml_size: number;

    @Column({ nullable: true })
    pdf_size: number;

    @Column({ default: 'USD' })
    currency: string;

    @Column({ default: 0, type: 'float' }) 
    tax_inclusive_amount: number;

    @Column({ default: DocumentType.INVOICE }) 
    document_type: DocumentType;

    @Index()
    @Column({ nullable: true })
    reference_document_id: string

    @Column({ nullable: true })
    reference_document_number: string

    @Column({ nullable: true, type: 'text' })
    document: string

    @Column({ type: "timestamp", nullable: true })
    accepted_at: Date;

    @Column({ type: "timestamp", nullable: true })
    rejected_at: Date;

    @Column({ default: 'PENDING'})
    status: string

    @Column({ name: 'verification_link', nullable: true})
    verification_link: string 
}

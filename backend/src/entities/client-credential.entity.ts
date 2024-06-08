import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, BeforeUpdate, BeforeInsert } from 'typeorm';
import { hash } from 'bcrypt';

@Entity()
export class ClientSecretKey {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  moc_id: string;

  @Column({ length: 100 })
  refresh_token: string;

  @Column({ nullable: true })
  company_name_en: string;

  @Column({ nullable: true })
  company_name_kh: string;

  @Column({ nullable: true})
  tin: string;

  @Column({ nullable: true })
  date_of_incorporation: Date;

  @Column({ nullable: true })
  business_type: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  phone_number: string;

  @Column({ nullable: true })
  email: string;

  @Column({ default: 1 })
  step: number;

  @Column({ nullable: true })
  merchant_name: string;

  @Column({ nullable: true })
  merchant_id: string;

  @Column({ nullable: true })
  bank_name: string;

  @Column({ nullable: true })
  bank_account_number: string;

  @Column({ nullable: true })
  certificate_of_incorporation: number;

  @Column({ nullable: true })
  certificate_of_tax_registration: number;

  @Column({ nullable: true })
  bank_acc_ownership_doc: number;

  @Column({ nullable: true })
  authorized_letter: number;

  @Column({ nullable: true })
  supporting_doc: number;

  certificate_of_incorporation_file: File;

  certificate_of_tax_registration_file: File;

  bank_acc_ownership_doc_file: File;

  supporting_doc_file: File;

  authorized_letter_file: File;

  @Column({ nullable: true })
  rejected_at: Date;

  @Column({ nullable: true })
  national_id: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  rejection_type: string;

  @Column({ nullable: true })
  rejection_message: string;

  @Column({ default: true })
  is_active: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

}

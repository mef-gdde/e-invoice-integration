import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';

export class AcceptInvoiceDto {
  @IsOptional()
  @IsString()
  document_id: string;
}
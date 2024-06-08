import { IsNotEmpty, IsEmail, IsString, IsOptional } from 'class-validator';

export class InvoiceReceivedDto {
  @IsOptional()
  @IsString()
  event_type: string;

  @IsOptional()
  @IsString()
  document_id: string;
}
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class AuthorizeDto {
  @IsNotEmpty()
  auth_token: string
}
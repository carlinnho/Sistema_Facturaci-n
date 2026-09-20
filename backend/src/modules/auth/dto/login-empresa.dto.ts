import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

export class LoginEmpresaDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

import { IsEmail, IsNotEmpty } from 'class-validator';

export class forgotPassDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}

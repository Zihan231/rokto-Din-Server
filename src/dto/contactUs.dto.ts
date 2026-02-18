import { IsEmail, IsNotEmpty, IsString, Length } from 'class-validator';

export class ContactUsDto {
  @IsNotEmpty({ message: 'Email can not be empty' })
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsNotEmpty({ message: 'Subject can not be empty' })
  @IsString()
  @Length(5, 255, {
    message: 'Subject must be between 5 and 255 characters',
  })
  subject: string;

  @IsNotEmpty({ message: 'Message can not be empty' })
  @IsString()
  @Length(10, 2000, {
    message: 'Message must be between 10 and 2000 characters',
  })
  message: string;
}

import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class changePassDto {
  @IsNotEmpty()
  @IsString()
  currentPass: string;

  @IsNotEmpty({ message: 'Password can not be empty' })
  @IsString()
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
  })
  newPassword: string;

  @IsNotEmpty({ message: 'Password can not be empty' })
  @IsString()
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
  })
  confirmPassword: string;
}

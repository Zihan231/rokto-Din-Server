/* eslint-disable @typescript-eslint/no-unsafe-call */
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { BloodGroup } from 'src/Entity/enum/bloodGroup.enum';
import { District } from 'src/Entity/enum/district.enum';
import { Division } from 'src/Entity/enum/division.enum';

export class CreateDonorDto {
  @IsNotEmpty({ message: 'Email can not be empty' })
  @IsEmail()
  @IsString()
  @Matches(/^[A-Za-z0-9]+@[A-Za-z0-9]+\.com$/, {
    message: 'Email must contain only letters/numbers and end with .com',
  })
  email: string;

  @IsNotEmpty({ message: 'Full name can not be empty' })
  @IsString()
  @Length(3, 255, { message: 'Full name must be between 3 and 255 characters' })
  fullName: string;

  @IsNotEmpty({ message: 'Password can not be empty' })
  @IsString()
  @Length(6, 20, { message: 'Password must be between 6 and 20 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>])/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one special character',
  })
  password: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(Division)
  division: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(District)
  district: string;

  @IsNotEmpty()
  @IsString()
  @IsEnum(BloodGroup)
  bloodGroup: string;

  @IsNotEmpty()
  @Matches(/^(\+8801|01)[3-9]\d{8}$/, {
    message: 'Phone number must be a valid Bangladeshi number',
  })
  phoneNumber: string;

  @IsOptional()
  @Matches(/^(\+8801|01)[3-9]\d{8}$/, {
    message: 'Phone number must be a valid Bangladeshi number',
  })
  whatsappNumber: string;

  @IsOptional()
  @Matches(/^(https?:\/\/)?(www\.)?facebook\.com\/[a-zA-Z0-9(.?)?]/, {
    message: 'Must be a valid Facebook profile or page URL',
  })
  facebookLink: string;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'lastDonation must be a valid date string (YYYY-MM-DD)' },
  )
  lastDonation: string;

  @IsOptional()
  @IsIn(['onn', 'off'], {
    message: 'donationStatus must be either "onn" or "off"',
  })
  donationStatus: string = 'onn';

  @IsOptional()
  @IsNumber()
  totalDonation: number = 0;
}

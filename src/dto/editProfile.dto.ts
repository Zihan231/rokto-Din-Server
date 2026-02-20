import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
} from 'class-validator';
import { BloodGroup } from 'src/Entity/enum/bloodGroup.enum';
import { District } from 'src/Entity/enum/district.enum';
import { Division } from 'src/Entity/enum/division.enum';

export class editProfileDto {
  @IsOptional()
  @IsEmail()
  @IsString()
  email: string;

  @IsOptional()
  @IsString()
  @Length(3, 255, { message: 'Full name must be between 3 and 255 characters' })
  fullName: string;

  @IsOptional()
  @IsString()
  @IsEnum(Division)
  division: string;

  @IsOptional()
  @IsString()
  @IsEnum(District)
  district: string;

  @IsOptional()
  @IsString()
  @IsEnum(BloodGroup)
  bloodGroup: string;

  @IsOptional()
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
}

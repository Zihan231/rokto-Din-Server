/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class donationRecordDto {
  @IsNotEmpty({ message: 'Donation date can not be empty' })
  @IsDateString(
    {},
    { message: 'Donation date must be a valid date string (YYYY-MM-DD)' },
  )
  donationDate: string;

  @IsNotEmpty({ message: 'Hospital name can not be empty' })
  @IsString({ message: 'Hospital name must be a string' })
  hospitalName: string;

  @IsNotEmpty({ message: 'Units donated can not be empty' })
  @IsNumber({}, { message: 'Units donated must be a number' })
  unitsDonated: number;
}

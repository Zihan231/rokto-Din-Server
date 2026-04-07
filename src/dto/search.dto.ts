import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { BloodGroup } from '../Entity/enum/bloodGroup.enum';
import { District } from '../Entity/enum/district.enum';
import { Division } from '../Entity/enum/division.enum';

export class SearchDto {
  @IsNotEmpty()
  @IsEnum(BloodGroup)
  bloodGroup: string;

  @IsOptional()
  @IsEnum(Division)
  division: string;

  @IsOptional()
  @IsEnum(District)
  district: string;

  @IsOptional()
  @IsNumber()
  limit: number;

  @IsOptional()
  @IsNumber()
  page: number;
}

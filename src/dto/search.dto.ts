import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { BloodGroup } from 'src/Entity/enum/bloodGroup.enum';
import { District } from 'src/Entity/enum/district.enum';
import { Division } from 'src/Entity/enum/division.enum';

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

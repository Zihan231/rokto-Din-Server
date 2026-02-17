import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DonorService } from './donor.service';
import { CreateDonorDto } from 'src/dto/createDonor.dto';
import { donationRecordDto } from 'src/dto/donationRecord.dto';

@Controller('donor')
export class DonorController {
  constructor(private readonly donorService: DonorService) {}
  @Get('test')
  test(): string {
    return this.donorService.test();
  }

  // create donor
  @Post('create')
  @UsePipes(new ValidationPipe())
  createDonor(@Body() donorData: CreateDonorDto) {
    return this.donorService.createDonor(donorData);
  }
  // create donation record

  @Post(':donorId/donation-record')
  @UsePipes(new ValidationPipe())
  createDonationRecord(
    @Param('donorId', ParseIntPipe) donorId: number,
    @Body() recordData: donationRecordDto,
  ) {
    return this.donorService.createDonationRecord(donorId, recordData);
  }
}

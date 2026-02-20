/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DonorService } from './donor.service';
import { CreateDonorDto } from 'src/dto/createDonor.dto';
import { donationRecordDto } from 'src/dto/donationRecord.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { editProfileDto } from 'src/dto/editProfile.dto';

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

  @Post('create-donation-record')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  createDonationRecord(
    @Body() recordData: donationRecordDto,
    @Req() req: Request,
  ) {
    const donorId: number = req['user'].id;
    return this.donorService.createDonationRecord(donorId, recordData);
  }

  // Donor profile
  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@Req() req: Request) {
    const donorId: number = req['user'].id;
    return this.donorService.getProfile(donorId);
  }

  // See Donation Record
  @Get('donation-records')
  @UseGuards(AuthGuard)
  getDonationRecords(
    @Req() req: Request,
    @Query() query: { limit: number; page: number; hospitalName: string },
  ) {
    const donorId: number = req['user'].id;
    return this.donorService.getDonationRecords(donorId, query);
  }

  // edit profile
  @Post('edit-profile')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  editProfile(@Body() inputData: editProfileDto, @Req() req: Request) {
    const donorId: number = req['user'].id;
    return this.donorService.editProfile(donorId, inputData);
  }
}

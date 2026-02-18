/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDonorDto } from 'src/dto/createDonor.dto';
import { Donor } from 'src/Entity/donor.entity';
import { Repository } from 'typeorm';
import { divisionDistrictMap } from 'src/Entity/divisionDistrictMap';
import * as bcrypt from 'bcrypt';
import { donationRecordDto } from 'src/dto/donationRecord.dto';
import { Record } from 'src/Entity/record.entity';

@Injectable()
export class DonorService {
  constructor(
    @InjectRepository(Donor)
    private donorRepo: Repository<Donor>,
    @InjectRepository(Record)
    private recordRepo: Repository<Record>,
  ) {}
  test(): string {
    return 'API is working fine !';
  }

  // Create Donor
  async createDonor(data: CreateDonorDto): Promise<object> {
    // 1️⃣ Check if donor email already exists
    const donorExists = await this.donorRepo.findOne({
      where: { email: data.email },
    });
    if (donorExists) {
      throw new HttpException(
        'Donor with this email already exists',
        HttpStatus.CONFLICT,
      );
    }

    // 2️⃣ Check division → district
    if (!divisionDistrictMap[data.division]?.includes(data.district)) {
      throw new HttpException(
        `District ${data.district} does not belong to division ${data.division}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3️⃣ Hash the password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // 4️⃣ Create donor entity
    const newDonor = this.donorRepo.create({
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      division: data.division,
      district: data.district,
      bloodGroup: data.bloodGroup,
      phoneNumber: data.phoneNumber,
      whatsappNumber: data.whatsappNumber,
      facebookLink: data.facebookLink,
      lastDonation: data.lastDonation,
      donationStatus: data.donationStatus ?? 'onn',
      totalDonation: data.totalDonation ?? 0,
    });

    // 5️⃣ Save to DB
    const savedDonor = await this.donorRepo.save(newDonor);

    // 6️⃣ Remove password before returning
    const { password, ...donorWithoutPassword } = savedDonor;

    // 7️⃣ Return response with proper status code
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Donor created successfully',
      data: donorWithoutPassword,
    };
  }

  // create donation record
  async createDonationRecord(
    donorId: number,
    recordData: donationRecordDto,
  ): Promise<object> {
    // 1️⃣ Find the donor
    const donor = await this.donorRepo.findOne({ where: { id: donorId } });
    if (!donor) {
      throw new HttpException('Donor not found', HttpStatus.NOT_FOUND);
    }

    // 2️⃣ Create record entity
    const newRecord = this.recordRepo.create({
      donationDate: recordData.donationDate,
      hospitalName: recordData.hospitalName,
      unitsDonated: recordData.unitsDonated,
      donor: donor, // link to donor
    });

    // 3️⃣ Save to DB
    const savedRecord = await this.recordRepo.save(newRecord);

    // 4️⃣ Return response (status code 201)
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Donation record created successfully',
      data: savedRecord,
    };
  }
}

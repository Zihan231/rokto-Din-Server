/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
import { editProfileDto } from 'src/dto/editProfile.dto';

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

    // 1.5️⃣  VALIDATION: Check for at least one contact method
    // We check if all three are falsy (null, undefined, or empty string)
    if (!data.phoneNumber && !data.whatsappNumber && !data.facebookLink) {
      throw new HttpException(
        'You must provide at least one contact method (Phone, WhatsApp, or Facebook).',
        HttpStatus.BAD_REQUEST,
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
      // ... rest of your code ...
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

    // 7️⃣ Return response
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
      donor: donor,
    });

    // 3️⃣ Save the Donation Record
    const savedRecord = await this.recordRepo.save(newRecord);

    // 4️⃣ Update Donor's Total Donation Count (+1) & Save
    donor.totalDonation = (donor.totalDonation || 0) + 1;

    donor.lastDonation = recordData.donationDate;

    await this.donorRepo.save(donor);

    // 5️⃣ Return response
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Donation record created successfully',
      data: savedRecord,
    };
  }

  // See Profile
  async getProfile(donorId: number): Promise<object> {
    const donor = await this.donorRepo.findOne({ where: { id: donorId } });
    if (!donor) {
      throw new HttpException('Donor not found', HttpStatus.NOT_FOUND);
    }
    return {
      statusCode: HttpStatus.OK,
      data: donor,
    };
  }

  // see donation record
  async getDonationRecords(donorId: number, query): Promise<object> {
    // 1️⃣ Extract sort, default it to 'desc' (Newest first)
    const { limit = 8, page = 1, hospitalName, sort = 'desc' } = query;

    // Check donor exists
    const donorExist = await this.donorRepo.findOne({ where: { id: donorId } });
    if (!donorExist) {
      throw new HttpException('Donor not found', HttpStatus.NOT_FOUND);
    }

    const skip = (Number(page) - 1) * Number(limit);

    // Build query
    const qb = this.recordRepo
      .createQueryBuilder('record')
      .where('record.donorId = :donorId', { donorId });

    // Optional hospital name filter
    if (hospitalName) {
      qb.andWhere('LOWER(record.hospitalName) LIKE LOWER(:hospitalName)', {
        hospitalName: `%${hospitalName}%`,
      });
    }

    // 2️⃣ Apply Sorting strictly by donationDate
    // Normalize to uppercase 'ASC' (Oldest first) or 'DESC' (Newest first)
    const orderDirection = sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    // 🔥 FIX: Order ONLY by donationDate
    qb.orderBy('record.donationDate', orderDirection);

    // Pagination
    qb.skip(skip).take(Number(limit));

    const [records, total] = await qb.getManyAndCount();

    return {
      data: records,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }

  // Edit Profile
  async editProfile(donorId: number, data: editProfileDto): Promise<object> {
    // 🚫 0️⃣ Check if body is empty
    if (!data || Object.keys(data).length === 0) {
      throw new HttpException(
        'No data provided to update',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1️⃣ Find donor
    const donor = await this.donorRepo.findOne({
      where: { id: donorId },
    });

    if (!donor) {
      throw new HttpException('Donor not found', HttpStatus.NOT_FOUND);
    }

    // 2️⃣ Prevent duplicate email
    if (data.email && data.email !== donor.email) {
      const emailExist = await this.donorRepo.findOne({
        where: { email: data.email },
      });

      if (emailExist) {
        throw new HttpException('Email already in use', HttpStatus.CONFLICT);
      }
    }

    // 3️⃣ Update only provided fields
    Object.assign(donor, data);

    // 4️⃣ Save
    const updatedDonor = await this.donorRepo.save(donor);

    // 5️⃣ Response
    return {
      message: 'Profile updated successfully',
      data: {
        id: updatedDonor.id,
        fullName: updatedDonor.fullName,
        email: updatedDonor.email,
        division: updatedDonor.division,
        district: updatedDonor.district,
        bloodGroup: updatedDonor.bloodGroup,
        phoneNumber: updatedDonor.phoneNumber,
        whatsappNumber: updatedDonor.whatsappNumber,
        facebookLink: updatedDonor.facebookLink,
      },
    };
  }

  // change donation status
  async UpdateDonationStatus(
    donorId: number,
    data: 'onn' | 'off',
  ): Promise<object> {
    // 🚫 0️⃣ Check if data is valid
    if (data !== 'onn' && data !== 'off') {
      throw new HttpException(
        'Invalid status provided. Must be "onn" or "off"',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 1️⃣ Find donor
    const donor = await this.donorRepo.findOne({
      where: { id: donorId },
    });

    if (!donor) {
      throw new HttpException('Donor not found', HttpStatus.NOT_FOUND);
    }

    // 2️⃣ Update the status
    donor.donationStatus = data;

    // 3️⃣ Save the updated donor back to the database
    await this.donorRepo.save(donor);

    // 4️⃣ Return a clear success response
    return {
      success: true,
      message: `Donor availability updated to ${data.toUpperCase()}`,
      donorId: donor.id,
      currentStatus: donor.donationStatus,
    };
  }
}

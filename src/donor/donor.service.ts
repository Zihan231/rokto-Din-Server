/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateDonorDto } from '../dto/createDonor.dto';
import { Donor } from '../Entity/donor.entity';
import { Repository } from 'typeorm';
import { divisionDistrictMap } from '../Entity/divisionDistrictMap';
import * as bcrypt from 'bcrypt';
import { donationRecordDto } from '../dto/donationRecord.dto';
import { Record } from '../Entity/record.entity';
import { editProfileDto } from '../dto/editProfile.dto';

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

    // 1.5️⃣ VALIDATION: At least one contact method is required
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

    // 2.5️⃣ VALIDATION: lastDonation must not be a future date
    let normalizedLastDonation: string | undefined = undefined;

    if (data.lastDonation) {
      const lastDonationObj = this.toDateOnly(data.lastDonation);
      const today = this.toDateOnly(new Date());

      if (lastDonationObj > today) {
        throw new HttpException(
          'Last donation date cannot be in the future. Please select today or a past date.',
          HttpStatus.BAD_REQUEST,
        );
      }

      normalizedLastDonation = this.toDbDateString(lastDonationObj);
    }

    // 3️⃣ Hash password
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(data.password, salt);

    // 4️⃣ Create donor entity
    const newDonor: Donor = this.donorRepo.create({
      fullName: data.fullName,
      email: data.email,
      password: hashedPassword,
      division: data.division,
      district: data.district,
      bloodGroup: data.bloodGroup,
      phoneNumber: data.phoneNumber,
      whatsappNumber: data.whatsappNumber,
      facebookLink: data.facebookLink,
      lastDonation: normalizedLastDonation,
      donationStatus: data.donationStatus ?? 'onn',
      totalDonation: data.totalDonation ?? 0,
    });

    // 5️⃣ Save to DB
    const savedDonor: Donor = await this.donorRepo.save(newDonor);

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
    const donor = await this.donorRepo.findOne({ where: { id: donorId } });
    if (!donor) {
      throw new HttpException('Donor not found', HttpStatus.NOT_FOUND);
    }

    const donationDateObj = this.toDateOnly(recordData.donationDate);
    const today = this.toDateOnly(new Date());
    const donationDateString = this.toDbDateString(donationDateObj);

    // Future date not allowed
    if (donationDateObj > today) {
      throw new HttpException(
        'Donation date cannot be in the future. Please select today or a past date.',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Validate only against donor.lastDonation
    if (donor.lastDonation) {
      const lastDonationObj = this.toDateOnly(donor.lastDonation);

      // Older or same date not allowed
      if (donationDateObj <= lastDonationObj) {
        throw new HttpException(
          `Donation date must be later than the donor's last donation date (${this.formatDate(lastDonationObj)}). Older or same-date entries are not allowed.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Must wait at least 2 months
      const nextAllowedDate = this.addMonths(lastDonationObj, 2);

      if (donationDateObj < nextAllowedDate) {
        throw new HttpException(
          `You cannot add a new donation within 2 months of the last donation. Last donation was on ${this.formatDate(lastDonationObj)}. Next allowed date is ${this.formatDate(nextAllowedDate)}.`,
          HttpStatus.BAD_REQUEST,
        );
      }
    }

    const newRecord = this.recordRepo.create({
      donationDate: donationDateString,
      hospitalName: recordData.hospitalName,
      unitsDonated: recordData.unitsDonated,
      donor: donor,
    });

    const savedRecord = await this.recordRepo.save(newRecord);

    donor.totalDonation = (donor.totalDonation || 0) + 1;
    donor.lastDonation = donationDateString;

    await this.donorRepo.save(donor);

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

  // Helper functions
  private toDateOnly(value: string | Date): Date {
    if (value instanceof Date) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    }

    const raw = String(value).split('T')[0];
    const [year, month, day] = raw.split('-').map(Number);

    return new Date(year, month - 1, day);
  }

  private addMonths(date: Date, months: number): Date {
    const result = new Date(date);
    result.setMonth(result.getMonth() + months);
    return result;
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private toDbDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}

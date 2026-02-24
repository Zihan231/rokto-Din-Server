/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactUsDto } from 'src/dto/contactUs.dto';
import { SearchDto } from 'src/dto/search.dto';
import { Contact } from 'src/Entity/contact.entity';
import { Donor } from 'src/Entity/donor.entity';
import { MailService } from 'src/mail/mail.service';
import { Repository } from 'typeorm';
import { LessThanOrEqual, IsNull } from 'typeorm';
@Injectable()
export class userService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectRepository(Donor)
    private donorRepo: Repository<Donor>,
    private readonly mailService: MailService,
  ) {}
  test() {
    return 'This is user service';
  }
  // contact us
  async contactUs(contactData: ContactUsDto): Promise<object> {
    const { email, subject, message } = contactData;

    // 1️⃣ Create new contact entity
    const newContact = this.contactRepo.create({
      email,
      subject,
      message,
    });

    // 2️⃣ Save to database
    await this.contactRepo.save(newContact);

    // Send Message to Admin
    try {
      await this.mailService.sendContactMail(contactData);
    } catch {
      console.log('Email failed but contact saved.');
    }

    // 3️⃣ Return proper response
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: newContact,
    };
  }

  async search(query: SearchDto): Promise<object> {
    const { bloodGroup, division, district, limit = 8, page = 1 } = query;

    // 1. Calculate the cutoff date (Today - 2 months)
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const dateString = twoMonthsAgo.toISOString().split('T')[0];

    // 2. Build Base Filters (Common conditions)
    const baseFilters: any = {
      bloodGroup,
      donationStatus: 'onn', // Active donors only
    };

    if (division) {
      baseFilters.division = division;
    }
    if (district) {
      baseFilters.district = district;
    }

    const skip = (Number(page) - 1) * Number(limit);

    // 3. Use an Array for 'where' to create an OR condition
    // Logic: (BaseFilters AND Date <= 2 Months) OR (BaseFilters AND Date IS NULL)
    const [donors, total] = await this.donorRepo.findAndCount({
      where: [
        { ...baseFilters, lastDonation: LessThanOrEqual(dateString) }, // Eligible by time
        { ...baseFilters, lastDonation: IsNull() }, // New donor (never donated)
      ],
      skip: skip,
      take: Number(limit),
      order: { lastDonation: 'ASC' },
    });

    return {
      data: donors,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };
  }
}

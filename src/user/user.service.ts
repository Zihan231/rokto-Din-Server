/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactUsDto } from 'src/dto/contactUs.dto';
import { SearchDto } from 'src/dto/search.dto';
import { Contact } from 'src/Entity/contact.entity';
import { Donor } from 'src/Entity/donor.entity';
import { Repository } from 'typeorm';

@Injectable()
export class userService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
    @InjectRepository(Donor)
    private donorRepo: Repository<Donor>,
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

    // 3️⃣ Return proper response
    return {
      statusCode: HttpStatus.CREATED,
      message: 'Thank you for contacting us! We will get back to you soon.',
      data: newContact,
    };
  }
  // search Donor
  async search(query: SearchDto): Promise<object> {
    const { bloodGroup, division, district, limit = 8, page = 1 } = query;
    const filters: any = { bloodGroup };

    if (division) {
      filters.division = division;
    }
    if (district) {
      filters.district = district;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [donors, total] = await this.donorRepo.findAndCount({
      where: filters,
      skip: skip,
      take: Number(limit),
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

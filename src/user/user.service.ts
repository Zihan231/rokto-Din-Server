/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ContactUsDto } from 'src/dto/contactUs.dto';
import { Contact } from 'src/Entity/contact.entity';
import { Repository } from 'typeorm';

@Injectable()
export class userService {
  constructor(
    @InjectRepository(Contact)
    private contactRepo: Repository<Contact>,
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
}

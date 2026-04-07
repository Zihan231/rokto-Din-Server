import { Module } from '@nestjs/common';
import { userService } from './user.service';
import { userController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from '../Entity/contact.entity';
import { Donor } from '../Entity/donor.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Donor]), MailModule],
  controllers: [userController],
  providers: [userService],
})
export class UserModule {}

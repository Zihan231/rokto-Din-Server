import { Module } from '@nestjs/common';
import { userService } from './user.service';
import { userController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from 'src/Entity/contact.entity';
import { Donor } from 'src/Entity/donor.entity';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Donor]), MailModule],
  controllers: [userController],
  providers: [userService],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { userService } from './user.service';
import { userController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Contact } from 'src/Entity/contact.entity';
import { Donor } from 'src/Entity/donor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Donor])],
  controllers: [userController],
  providers: [userService],
})
export class UserModule {}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';
import { Donor } from '../Entity/donor.entity';
import { Record } from '../Entity/record.entity';
import { Contact } from '../Entity/contact.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Donor, Record, Contact])],
  controllers: [DonorController],
  providers: [DonorService],
  exports: [DonorService],
})
export class DonorModule {}

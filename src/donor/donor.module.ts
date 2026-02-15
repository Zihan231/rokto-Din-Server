import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DonorController } from './donor.controller';
import { DonorService } from './donor.service';
import { Donor } from 'src/Entity/donor.entity';
import { Record } from 'src/Entity/record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Donor, Record])],
  controllers: [DonorController],
  providers: [DonorService],
})
export class DonorModule {}

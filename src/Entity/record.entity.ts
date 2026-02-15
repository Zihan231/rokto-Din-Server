import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Donor } from './donor.entity';

@Entity('donation_records')
export class Record {
  @PrimaryGeneratedColumn()
  recordId: number;
  @Column({ type: 'date', nullable: false })
  donationDate: string;

  @Column({ type: 'varchar', nullable: false })
  hospitalName: string;

  @Column({ type: 'int', nullable: false })
  unitsDonated: number;

  @ManyToOne(() => Donor, (donor) => donor.donationRecords, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'donorId' })
  donor: Donor;
}

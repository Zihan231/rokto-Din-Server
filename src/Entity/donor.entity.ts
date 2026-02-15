import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { District } from './enum/district.enum';
import { Division } from './enum/division.enum';
import { BloodGroup } from './enum/bloodGroup.enum';
import { Record } from './record.entity';

@Entity('donors')
export class Donor {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({
    type: 'enum',
    enum: Division,
  })
  division: string;

  @Column({
    type: 'enum',
    enum: District,
  })
  district: string;

  @Column({
    type: 'enum',
    enum: BloodGroup,
  })
  bloodGroup: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  whatsappNumber: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  facebookLink: string;

  @Column({ type: 'date', nullable: true })
  lastDonation: string;

  @Column({ type: 'enum', enum: ['onn', 'off'], default: 'onn' })
  donationStatus: string;

  @Column({ type: 'int', nullable: true, default: 0 })
  totalDonation: number;

  @OneToMany(() => Record, (record) => record.donor)
  donationRecords: Record[];
}

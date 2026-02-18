/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DonorModule } from 'src/donor/donor.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Donor } from 'src/Entity/donor.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    DonorModule,
    TypeOrmModule.forFeature([Donor]),
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          // FIX: Cast to 'any' or 'string | number' to satisfy the type checker
          expiresIn: configService.get('JWT_EXPIRES'), 
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
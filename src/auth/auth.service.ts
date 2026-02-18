import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from 'src/dto/login.dto';
import { Donor } from 'src/Entity/donor.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Donor)
    private donorRepo: Repository<Donor>,
  ) {}
  // login method
  async login(data: LoginDto): Promise<{ token: string }> {
    const userExist = await this.donorRepo.findOne({
      where: { email: data.email },
    });
    if (!userExist) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    }
    const isPasswordValid = await bcrypt.compare(
      data.password,
      userExist.password,
    );
    if (!isPasswordValid) {
      throw new HttpException(
        'Invalid email or password',
        HttpStatus.UNAUTHORIZED,
      );
    } else {
      const payload = {
        email: userExist.email,
        id: userExist.id,
        name: userExist.fullName,
      };
      return {
        token: await this.jwtService.signAsync(payload),
      };
    }
  }
}

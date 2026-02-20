/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from 'src/dto/login.dto';
import { Donor } from 'src/Entity/donor.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { changePassDto } from 'src/dto/changePass.dto';
import { forgotPassDto } from 'src/dto/forgotPass.dto';
import { MailService } from 'src/mail/mail.service';
import { ResetPasswordDto } from 'src/dto/ResetPassword.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Donor)
    private donorRepo: Repository<Donor>,
    private readonly mailService: MailService,
  ) {}
  // login method
  async login(data: LoginDto): Promise<{ token: string }> {
    const userExist = await this.donorRepo.findOne({
      where: { email: data.email },
      select: [
        'id',
        'email',
        'fullName',
        'password',
        'totalDonation',
        'lastDonation',
        'donationStatus',
        'bloodGroup',
      ],
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
        id: userExist.id,
        email: userExist.email,
        fullName: userExist.fullName,
        totalDonation: userExist.totalDonation,
        lastDonation: userExist.lastDonation,
        donationStatus: userExist.donationStatus,
        bloodGroup: userExist.bloodGroup,
      };
      return {
        token: await this.jwtService.signAsync(payload),
      };
    }
  }

  // change pass
  async changePass(donorId: number, data: changePassDto): Promise<object> {
    const { currentPass, newPassword, confirmPassword } = data;

    const userExist = await this.donorRepo.findOne({
      where: { id: donorId },
      select: ['password'],
    });

    if (!userExist) {
      throw new HttpException('Unauthorized Access', HttpStatus.UNAUTHORIZED);
    }

    const isPasswordValid = await bcrypt.compare(
      currentPass,
      userExist.password,
    );

    if (!isPasswordValid) {
      throw new HttpException(
        'Current password is incorrect',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (newPassword !== confirmPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }
    if (currentPass === newPassword) {
      throw new HttpException(
        'New password cannot be same as old password',
        HttpStatus.BAD_REQUEST,
      );
    }
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // ✅ update existing user
    userExist.password = hashedPassword;
    await this.donorRepo.update(donorId, {
      password: hashedPassword,
    });

    return {
      statusCode: HttpStatus.OK,
      message: 'Password changed successfully',
    };
  }

  // reset password
  async forgotPassword(data: forgotPassDto): Promise<object> {
    const { email } = data;

    // 1️⃣ Find user
    const user = await this.donorRepo.findOne({
      where: { email },
      select: ['id', 'email'], // make sure email and id are selected
    });

    if (!user) {
      // Don't reveal if email exists or not for security
      return { message: 'If this email exists, a reset link has been sent' };
    }

    // 2️⃣ Generate short-lived JWT reset token
    const resetToken = this.jwtService.sign(
      { id: user.id },
      { secret: process.env.JWT_RESET_SECRET, expiresIn: '5m' },
    );

    // 3️⃣ Build reset link
    const resetLink = `http://localhost:3001/reset-password?token=${resetToken}`;

    // 4️⃣ Send email
    await this.mailService.sendResetEmail(user.email, resetLink);

    return { message: 'If this email exists, a reset link has been sent' };
  }

  // reset password
  async resetPassword(data: ResetPasswordDto): Promise<object> {
    const { token, newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    let payload: any;

    try {
      payload = this.jwtService.verify(token, {
        secret: process.env.JWT_RESET_SECRET,
      });
    } catch {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.BAD_REQUEST,
      );
    }

    const user = await this.donorRepo.findOne({
      where: { id: payload.id },
    });

    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Hash the new password and save it
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await this.donorRepo.save(user);

    try {
      await this.mailService.sendPasswordChangeSuccessEmail(user.email);
    } catch (error) {
      console.error('Could not send password success email:', error);
    }

    return { message: 'Password reset successfully' };
  }
}

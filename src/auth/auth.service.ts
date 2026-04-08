/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { LoginDto } from '../dto/login.dto';
import { Donor } from '../Entity/donor.entity';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { changePassDto } from '../dto/changePass.dto';
import { forgotPassDto } from '../dto/forgotPass.dto';
import { MailService } from '../mail/mail.service';
import { ResetPasswordDto } from '../dto/ResetPassword.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Donor)
    private donorRepo: Repository<Donor>,
    private readonly mailService: MailService,
  ) {}
  // login
  async login(data: LoginDto, res: Response): Promise<void> {
    // 0️⃣ Format email to lowercase and remove accidental whitespace
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

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
    }

    // 👇 Notice the `else {` is gone! Because the `if` above throws an error,
    // the code will naturally stop there if the password is wrong anyway.

    const payload = {
      id: userExist.id,
      email: userExist.email,
      fullName: userExist.fullName,
      totalDonation: userExist.totalDonation,
      lastDonation: userExist.lastDonation,
      donationStatus: userExist.donationStatus,
      bloodGroup: userExist.bloodGroup,
    };

    const token = await this.jwtService.signAsync(payload);

    // httpOnly
    res.cookie('jwt', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 1000 * 60 * 60,
      path: '/',
    });

    res.json({ message: 'Login Successful' });
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
    // 0️⃣ Format email to lowercase and remove accidental whitespace
    if (data.email) {
      data.email = data.email.toLowerCase().trim();
    }

    const { email } = data;

    // 1️⃣ Find user (Include lastResetRequest in selection)
    const user = await this.donorRepo.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'lastResetRequest'],
    });

    if (!user) {
      // Return same message for security (enumeration protection)
      return { message: 'If this email exists, a reset link has been sent' };
    }

    // ⏳ 1.5️⃣ Cooldown Check: 3 Minutes
    if (user.lastResetRequest) {
      const now = new Date();
      const lastRequest = new Date(user.lastResetRequest);
      const diffInMs = now.getTime() - lastRequest.getTime();
      const cooldownMs = 3 * 60 * 1000; // 3 minutes in milliseconds

      if (diffInMs < cooldownMs) {
        const secondsLeft = Math.ceil((cooldownMs - diffInMs) / 1000);
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;

        throw new HttpException(
          `Please wait ${minutes}m ${seconds}s before requesting another link.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }
    }

    // 2️⃣ Create a dynamic secret unique to this user's current password state
    const dynamicSecret = process.env.JWT_RESET_SECRET + user.password;

    // 3️⃣ Generate short-lived JWT reset token using the dynamic secret
    const resetToken = this.jwtService.sign(
      { id: user.id },
      { secret: dynamicSecret, expiresIn: '5m' },
    );

    // 4️⃣ Build reset link & Send email
    const resetLink = `https://rokto-din.vercel.app/reset-password?token=${resetToken}`;

    try {
      await this.mailService.sendResetEmail(user.email, resetLink);

      // 5️⃣ Only update timestamp if email sent successfully
      user.lastResetRequest = new Date();
      await this.donorRepo.save(user);
    } catch (error) {
      console.error('Mail delivery failed:', error);
      throw new HttpException(
        'Failed to send reset email. Please try again later.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    return { message: 'If this email exists, a reset link has been sent' };
  }

  // reset password
  async resetPassword(data: ResetPasswordDto): Promise<object> {
    const { token, newPassword, confirmPassword } = data;

    if (newPassword !== confirmPassword) {
      throw new HttpException('Passwords do not match', HttpStatus.BAD_REQUEST);
    }

    // 1️⃣ Decode the token WITHOUT verifying to get the user ID
    const decoded: any = this.jwtService.decode(token);

    if (!decoded || !decoded.id) {
      throw new HttpException('Invalid token format', HttpStatus.BAD_REQUEST);
    }

    // 2️⃣ Fetch the user from the database
    const user = await this.donorRepo.findOne({
      where: { id: decoded.id },
      select: ['id', 'email', 'password'], // Need the current password to verify
    });

    if (!user) {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 3️⃣ Reconstruct the dynamic secret using their CURRENT password
    const dynamicSecret = process.env.JWT_RESET_SECRET + user.password;

    try {
      // 4️⃣ Verify the token. If they already changed their password,
      // user.password will be different, the secret will be wrong, and this will fail!
      this.jwtService.verify(token, {
        secret: dynamicSecret,
      });
    } catch {
      throw new HttpException(
        'Invalid or expired token',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 5️⃣ Hash the new password and save it
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await this.donorRepo.save(user);

    // 6️⃣ Send Success Email
    try {
      await this.mailService.sendPasswordChangeSuccessEmail(user.email);
    } catch (error) {
      console.error('Could not send password success email:', error);
    }

    return { message: 'Password reset successfully' };
  }
}

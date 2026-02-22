/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Body,
  Controller,
  Post,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from 'src/dto/login.dto';
import { changePassDto } from 'src/dto/changePass.dto';
import { AuthGuard } from './auth.guard';
import { forgotPassDto } from 'src/dto/forgotPass.dto';
import { ResetPasswordDto } from 'src/dto/ResetPassword.dto';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Login
  @Post('login')
  @UsePipes(new ValidationPipe())
  login(@Body() loginData: LoginDto, @Res() res: Response) {
    return this.authService.login(loginData, res);
  }

  // change password
  @Post('change-password')
  @UseGuards(AuthGuard)
  @UsePipes(new ValidationPipe())
  cngPass(@Body() data: changePassDto, @Req() req: Request) {
    const donorId: number = req['user'].id;
    return this.authService.changePass(donorId, data);
  }

  // reset password
  @Post('forgot-password')
  @UsePipes(new ValidationPipe())
  forgotPass(@Body() data: forgotPassDto) {
    return this.authService.forgotPassword(data);
  }

  @Post('reset-password')
  @UsePipes(new ValidationPipe())
  resetPass(@Body() data: ResetPasswordDto) {
    return this.authService.resetPassword(data);
  }
}

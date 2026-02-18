import {
  Body,
  Controller,
  Get,
  Post,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { userService } from './user.service';
import { ContactUsDto } from 'src/dto/contactUs.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('user')
export class userController {
  constructor(private readonly userService: userService) {}

  @UseGuards(AuthGuard)
  @Get('test')
  test() {
    return this.userService.test();
  }
  // contact us
  @Post('contact')
  @UsePipes(new ValidationPipe())
  contactUs(@Body() contactData: ContactUsDto) {
    return this.userService.contactUs(contactData);
  }
}

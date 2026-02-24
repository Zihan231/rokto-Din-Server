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
import { SearchDto } from 'src/dto/search.dto';

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

  // search functionality
  @Post('search')
  @UsePipes(new ValidationPipe())
  search(@Body() query: SearchDto) {
    return this.userService.search(query);
  }
}

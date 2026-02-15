import { Controller, Get } from '@nestjs/common';
import { DonorService } from './donor.service';

@Controller('donor')
export class DonorController {
  constructor(private readonly donorService: DonorService) {}
  @Get('test')
  test(): string {
    return this.donorService.test();
  }
}

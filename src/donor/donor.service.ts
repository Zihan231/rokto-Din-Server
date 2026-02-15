import { Injectable } from '@nestjs/common';

@Injectable()
export class DonorService {
  test(): string {
    return 'API is working fine !';
  }
}

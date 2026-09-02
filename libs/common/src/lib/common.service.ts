import { Injectable } from '@nestjs/common';

@Injectable()
export class CommonService {
  getHealth(): { status: string; timestamp: number } {
    return { status: 'ok', timestamp: Date.now() };
  }

  getGreeting(name = 'API'): { message: string } {
    return { message: `Hello ${name}` };
  }
}

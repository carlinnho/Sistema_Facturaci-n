import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import * as bcrypt from 'bcrypt';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('generate-hash')
  async generateHash(): Promise<string> {
    const password = 'Contraseña.123';
    const hash = await bcrypt.hash(password, 10);
    return `Hash para "${password}": ${hash}`;
  }
}

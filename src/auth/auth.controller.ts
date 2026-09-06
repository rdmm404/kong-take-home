import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateDemoTokenDto } from './dto/requests/create-demo-token.dto';
import { DemoTokenDto } from './dto/responses/demo-token.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('demo-token')
  createDemoToken(@Body() body: CreateDemoTokenDto): Promise<DemoTokenDto> {
    return this.authService.createDemoToken(body);
  }
}

import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateDemoTokenDto } from './dto/requests/create-demo-token.dto';
import { DemoTokenDto } from './dto/responses/demo-token.dto';

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async createDemoToken(identity: CreateDemoTokenDto): Promise<DemoTokenDto> {
    return {
      accessToken: await this.jwtService.signAsync({
        userId: identity.userId,
        tenantId: identity.tenantId,
      }),
    };
  }
}

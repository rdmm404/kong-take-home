import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './authenticated-user.interface';

interface JwtPayload extends AuthenticatedUser {
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        algorithms: ['HS256'],
      });
    } catch {
      throw new UnauthorizedException();
    }

    if (!this.isValidIdentity(payload)) {
      throw new UnauthorizedException();
    }

    request.user = {
      userId: payload.userId,
      tenantId: payload.tenantId,
    };
    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const [scheme, token, extra] =
      request.headers.authorization?.split(' ') ?? [];

    if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
      return undefined;
    }

    return token;
  }

  private isValidIdentity(payload: JwtPayload): boolean {
    return (
      Number.isInteger(payload.userId) &&
      payload.userId > 0 &&
      Number.isInteger(payload.tenantId) &&
      payload.tenantId > 0
    );
  }
}

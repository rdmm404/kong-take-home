import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticatedRequest } from './authenticated-user.interface';
import { JwtAuthGuard } from './jwt-auth.guard';

function createContext(request: Partial<Request>): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  } as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  const secret = 'test-jwt-secret';
  let jwtService: JwtService;
  let guard: JwtAuthGuard;

  beforeEach(() => {
    jwtService = new JwtService({ secret });
    guard = new JwtAuthGuard(jwtService);
  });

  it('attaches a verified identity to the request', async () => {
    const token = await jwtService.signAsync(
      { userId: 7, tenantId: 2 },
      { algorithm: 'HS256' },
    );
    const request = {
      headers: { authorization: `Bearer ${token}` },
    } as AuthenticatedRequest;

    await expect(guard.canActivate(createContext(request))).resolves.toBe(true);
    expect(request.user).toEqual({ userId: 7, tenantId: 2 });
  });

  it('rejects a missing bearer token', async () => {
    const request = { headers: {} };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('rejects a token with an invalid signature', async () => {
    const invalidToken = await new JwtService({
      secret: 'other-secret',
    }).signAsync({ userId: 7, tenantId: 2 }, { algorithm: 'HS256' });
    const request = {
      headers: { authorization: `Bearer ${invalidToken}` },
    };

    await expect(guard.canActivate(createContext(request))).rejects.toThrow(
      UnauthorizedException,
    );
  });
});

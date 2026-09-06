import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  it('signs the supplied demo identity', async () => {
    const jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    };
    const authService = new AuthService(jwtService as unknown as JwtService);

    await expect(
      authService.createDemoToken({ userId: 7, tenantId: 2 }),
    ).resolves.toEqual({ accessToken: 'signed-token' });
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      userId: 7,
      tenantId: 2,
    });
  });
});

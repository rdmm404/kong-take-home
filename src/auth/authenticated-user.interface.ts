import { Request } from 'express';

export interface AuthenticatedUser {
  userId: number;
  tenantId: number;
}

export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
}

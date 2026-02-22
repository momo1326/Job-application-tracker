import { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../utils/tokens.js';

export interface AuthRequest extends Request {
  user?: { id: string; role: 'ADMIN' | 'USER' };
}

export const requireAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const payload = verifyAccessToken(authHeader.split(' ')[1]);
    req.user = { id: payload.sub, role: payload.role };
    return next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const requireRole = (role: 'ADMIN' | 'USER') =>
  (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    return next();
  };

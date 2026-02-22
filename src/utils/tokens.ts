import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export type JwtPayload = { sub: string; role: 'ADMIN' | 'USER' };

export const createAccessToken = (payload: JwtPayload) =>
  jwt.sign(payload, config.jwtAccessSecret, { expiresIn: '15m' });

export const createRefreshToken = (payload: JwtPayload) =>
  jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, config.jwtAccessSecret) as JwtPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, config.jwtRefreshSecret) as JwtPayload;

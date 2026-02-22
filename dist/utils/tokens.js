import jwt from 'jsonwebtoken';
import { config } from '../config.js';
export const createAccessToken = (payload) => jwt.sign(payload, config.jwtAccessSecret, { expiresIn: '15m' });
export const createRefreshToken = (payload) => jwt.sign(payload, config.jwtRefreshSecret, { expiresIn: '7d' });
export const verifyAccessToken = (token) => jwt.verify(token, config.jwtAccessSecret);
export const verifyRefreshToken = (token) => jwt.verify(token, config.jwtRefreshSecret);

import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/authService.js';

const emailPasswordSchema = z.object({ email: z.string().email(), password: z.string().min(8) });

export const register = async (req: Request, res: Response) => {
  const payload = emailPasswordSchema.parse(req.body);
  const user = await authService.register(payload.email, payload.password);
  res.status(201).json(user);
};

export const verifyEmail = async (req: Request, res: Response) => {
  await authService.verifyEmail(String(req.query.token));
  res.json({ message: 'Email verified' });
};

export const login = async (req: Request, res: Response) => {
  const payload = emailPasswordSchema.parse(req.body);
  const result = await authService.login(payload.email, payload.password);
  res.json(result);
};

export const refresh = async (req: Request, res: Response) => {
  const token = z.string().parse(req.body.refreshToken);
  const result = await authService.refresh(token);
  res.json(result);
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  const email = z.string().email().parse(req.body.email);
  await authService.requestPasswordReset(email);
  res.json({ message: 'If account exists, reset email sent' });
};

export const resetPassword = async (req: Request, res: Response) => {
  const body = z.object({ token: z.string(), newPassword: z.string().min(8) }).parse(req.body);
  await authService.resetPassword(body.token, body.newPassword);
  res.json({ message: 'Password reset complete' });
};

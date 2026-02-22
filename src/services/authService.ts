import crypto from 'node:crypto';
import { prisma } from '../models/prisma.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { sendEmail } from '../utils/mailer.js';
import { config } from '../config.js';

export const register = async (email: string, password: string) => {
  const passwordHash = await hashPassword(password);
  const verificationToken = crypto.randomBytes(24).toString('hex');

  const user = await prisma.user.create({
    data: { email, passwordHash, verificationToken }
  });

  await sendEmail(
    email,
    'Verify your email',
    `Click ${config.appUrl}/verify-email?token=${verificationToken}`
  );

  return { id: user.id, email: user.email };
};

export const verifyEmail = async (token: string) => {
  const user = await prisma.user.findFirst({ where: { verificationToken: token } });
  if (!user) throw new Error('Invalid verification token');

  await prisma.user.update({
    where: { id: user.id },
    data: { isEmailVerified: true, verificationToken: null }
  });
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('Invalid credentials');
  if (!user.isEmailVerified) throw new Error('Email is not verified');

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw new Error('Invalid credentials');

  const payload = { sub: user.id, role: user.role } as const;
  const accessToken = createAccessToken(payload);
  const refreshToken = createRefreshToken(payload);

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });

  return { accessToken, refreshToken, role: user.role };
};

export const refresh = async (token: string) => {
  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || user.refreshToken !== token) throw new Error('Invalid refresh token');

  return {
    accessToken: createAccessToken({ sub: user.id, role: user.role }),
    refreshToken: createRefreshToken({ sub: user.id, role: user.role })
  };
};

export const requestPasswordReset = async (email: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return;

  const resetToken = crypto.randomBytes(24).toString('hex');
  await prisma.user.update({ where: { id: user.id }, data: { resetToken } });

  await sendEmail(email, 'Password reset', `Reset: ${config.appUrl}/reset-password?token=${resetToken}`);
};

export const resetPassword = async (token: string, newPassword: string) => {
  const user = await prisma.user.findFirst({ where: { resetToken: token } });
  if (!user) throw new Error('Invalid reset token');

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(newPassword), resetToken: null }
  });
};

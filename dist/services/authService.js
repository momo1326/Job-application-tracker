import crypto from 'node:crypto';
import { prisma } from '../models/prisma.js';
import { hashPassword, verifyPassword } from '../utils/hash.js';
import { createAccessToken, createRefreshToken, verifyRefreshToken } from '../utils/tokens.js';
import { sendEmail } from '../utils/mailer.js';
import { config } from '../config.js';
import { badRequest, conflict, unauthorized } from '../utils/httpError.js';
export const register = async (email, password) => {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
        throw conflict('Email already registered');
    const passwordHash = await hashPassword(password);
    const verificationToken = crypto.randomBytes(24).toString('hex');
    const user = await prisma.user.create({
        data: { email, passwordHash, verificationToken }
    });
    await sendEmail(email, 'Verify your email', `Click ${config.appUrl}/verify-email?token=${verificationToken}`);
    return { id: user.id, email: user.email };
};
export const verifyEmail = async (token) => {
    if (!token || token === 'undefined')
        throw badRequest('Verification token is required');
    const user = await prisma.user.findFirst({ where: { verificationToken: token } });
    if (!user)
        throw badRequest('Invalid verification token');
    await prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true, verificationToken: null }
    });
};
export const login = async (email, password) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        throw unauthorized('Invalid credentials');
    if (!user.isEmailVerified)
        throw unauthorized('Email is not verified');
    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid)
        throw unauthorized('Invalid credentials');
    const payload = { sub: user.id, role: user.role };
    const accessToken = createAccessToken(payload);
    const refreshToken = createRefreshToken(payload);
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken } });
    return { accessToken, refreshToken, role: user.role };
};
export const refresh = async (token) => {
    const payload = verifyRefreshToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.refreshToken !== token)
        throw unauthorized('Invalid refresh token');
    const nextRefreshToken = createRefreshToken({ sub: user.id, role: user.role });
    await prisma.user.update({ where: { id: user.id }, data: { refreshToken: nextRefreshToken } });
    return {
        accessToken: createAccessToken({ sub: user.id, role: user.role }),
        refreshToken: nextRefreshToken
    };
};
export const requestPasswordReset = async (email) => {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
        return;
    const resetToken = crypto.randomBytes(24).toString('hex');
    await prisma.user.update({ where: { id: user.id }, data: { resetToken } });
    await sendEmail(email, 'Password reset', `Reset: ${config.appUrl}/reset-password?token=${resetToken}`);
};
export const resetPassword = async (token, newPassword) => {
    const user = await prisma.user.findFirst({ where: { resetToken: token } });
    if (!user)
        throw badRequest('Invalid reset token');
    await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: await hashPassword(newPassword), resetToken: null }
    });
};

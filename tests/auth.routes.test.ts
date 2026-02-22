import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const registerMock = vi.fn();
const loginMock = vi.fn();
const verifyEmailMock = vi.fn();
const refreshMock = vi.fn();
const requestPasswordResetMock = vi.fn();
const resetPasswordMock = vi.fn();

vi.mock('../src/services/authService.js', () => ({
  register: registerMock,
  login: loginMock,
  verifyEmail: verifyEmailMock,
  refresh: refreshMock,
  requestPasswordReset: requestPasswordResetMock,
  resetPassword: resetPasswordMock
}));

const { app } = await import('../src/app.js');

describe('auth routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POST /api/auth/register returns 201', async () => {
    registerMock.mockResolvedValueOnce({ id: 'user_1', email: 'demo@example.com' });

    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'demo@example.com', password: 'password123' });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ id: 'user_1', email: 'demo@example.com' });
    expect(registerMock).toHaveBeenCalledWith('demo@example.com', 'password123');
  });

  it('POST /api/auth/login returns access and refresh tokens', async () => {
    loginMock.mockResolvedValueOnce({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      role: 'USER'
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'demo@example.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBe('access-token');
    expect(response.body.refreshToken).toBe('refresh-token');
    expect(response.body.role).toBe('USER');
    expect(loginMock).toHaveBeenCalledWith('demo@example.com', 'password123');
  });
});

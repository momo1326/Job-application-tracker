import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  databaseUrl: process.env.DATABASE_URL ?? '',
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET ?? 'access_secret',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? 'refresh_secret',
  appUrl: process.env.APP_URL ?? 'http://localhost:5173',
  smtp: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_FROM ?? 'no-reply@jobtracker.dev'
  }
};

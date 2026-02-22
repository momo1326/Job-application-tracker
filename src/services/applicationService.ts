import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../models/prisma.js';

export const createApplication = (userId: string, data: any) => prisma.jobApplication.create({ data: { ...data, userId } });

export const listApplications = async (userId: string, query: any) => {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 10);
  const skip = (page - 1) * pageSize;

  const where = {
    userId,
    status: query.status ? (query.status as ApplicationStatus) : undefined,
    company: query.company ? { contains: query.company, mode: 'insensitive' as const } : undefined
  };

  const orderBy = query.sortBy ? { [query.sortBy]: query.sortOrder === 'asc' ? 'asc' : 'desc' } : { createdAt: 'desc' as const };

  const [items, total] = await Promise.all([
    prisma.jobApplication.findMany({ where, skip, take: pageSize, orderBy }),
    prisma.jobApplication.count({ where })
  ]);

  return { items, total, page, pageSize };
};

export const getAnalytics = async (userId: string) => {
  const byStatus = await prisma.jobApplication.groupBy({ by: ['status'], _count: true, where: { userId } });
  const monthly = await prisma.$queryRaw<{ month: string; count: bigint }[]>`
    SELECT to_char(date_trunc('month', "appliedDate"), 'YYYY-MM') as month, COUNT(*)::bigint as count
    FROM "JobApplication"
    WHERE "userId" = ${userId}
    GROUP BY 1
    ORDER BY 1;
  `;

  return {
    byStatus,
    monthly: monthly.map((m) => ({ month: m.month, count: Number(m.count) }))
  };
};

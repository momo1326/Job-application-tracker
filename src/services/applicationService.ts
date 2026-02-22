import { ApplicationStatus } from '@prisma/client';
import { prisma } from '../models/prisma.js';
import { notFound } from '../utils/httpError.js';

type CreateApplicationInput = {
  company: string;
  title: string;
  status?: ApplicationStatus;
  location?: string;
  notes?: string;
};

type UpdateApplicationInput = Partial<CreateApplicationInput>;

type ListApplicationsQuery = {
  page?: number;
  pageSize?: number;
  status?: ApplicationStatus;
  company?: string;
  sortBy?: 'createdAt' | 'appliedDate' | 'company' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
};

type AdminUsersQuery = {
  page?: number;
  pageSize?: number;
};

export const createApplication = (userId: string, data: CreateApplicationInput) => prisma.jobApplication.create({ data: { ...data, userId } });

export const listApplications = async (userId: string, query: ListApplicationsQuery) => {
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

export const updateApplication = async (userId: string, applicationId: string, data: UpdateApplicationInput) => {
  const existing = await prisma.jobApplication.findFirst({ where: { id: applicationId, userId } });
  if (!existing) throw notFound('Application not found');

  return prisma.jobApplication.update({
    where: { id: applicationId },
    data
  });
};

export const deleteApplication = async (userId: string, applicationId: string) => {
  const existing = await prisma.jobApplication.findFirst({ where: { id: applicationId, userId } });
  if (!existing) throw notFound('Application not found');

  await prisma.jobApplication.delete({ where: { id: applicationId } });
};

export const listUsersForAdmin = async (query: AdminUsersQuery) => {
  const page = Number(query.page ?? 1);
  const pageSize = Number(query.pageSize ?? 10);
  const skip = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    prisma.user.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        isEmailVerified: true,
        createdAt: true,
        _count: {
          select: { applications: true }
        }
      }
    }),
    prisma.user.count()
  ]);

  return { items, total, page, pageSize };
};

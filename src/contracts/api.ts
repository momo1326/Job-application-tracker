export type Status = 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

export type UserRole = 'ADMIN' | 'USER';

export type RegisterResponse = {
  id: string;
  email: string;
};

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  role: UserRole;
};

export type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

export type ListApplicationsQuery = {
  page?: number;
  pageSize?: number;
  status?: Status;
  company?: string;
  sortBy?: 'createdAt' | 'appliedDate' | 'company' | 'status' | 'title';
  sortOrder?: 'asc' | 'desc';
};

export type AdminUsersQuery = {
  page?: number;
  pageSize?: number;
};

export type JobApplicationDto = {
  id: string;
  company: string;
  title: string;
  status: Status;
  location: string | null;
  notes: string | null;
  createdAt: string;
};

export type ListApplicationsResponse = {
  items: JobApplicationDto[];
  total: number;
  page: number;
  pageSize: number;
};

export type AnalyticsResponse = {
  byStatus: Array<{ status: Status; _count: number }>;
  monthly: Array<{ month: string; count: number }>;
};

export type AdminUserDto = {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  _count: { applications: number };
};

export type AdminUsersResponse = {
  items: AdminUserDto[];
  total: number;
  page: number;
  pageSize: number;
};
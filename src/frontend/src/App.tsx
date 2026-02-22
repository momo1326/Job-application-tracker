import { FormEvent, useEffect, useMemo, useState } from 'react';

type Status = 'APPLIED' | 'INTERVIEW' | 'OFFER' | 'REJECTED';

type JobApplication = {
  id: string;
  company: string;
  title: string;
  status: Status;
  location: string | null;
  notes: string | null;
  createdAt: string;
};

type AnalyticsResponse = {
  byStatus: Array<{ status: Status; _count: number }>;
};

type UserRole = 'ADMIN' | 'USER';

type AdminUser = {
  id: string;
  email: string;
  role: UserRole;
  isEmailVerified: boolean;
  createdAt: string;
  _count: { applications: number };
};

type ApplicationsResponse = {
  items: JobApplication[];
  total: number;
  page: number;
  pageSize: number;
};

type AdminUsersResponse = {
  items: AdminUser[];
  total: number;
  page: number;
  pageSize: number;
};

type AppFormState = {
  company: string;
  title: string;
  status: Status;
  location: string;
  notes: string;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const STATUS_OPTIONS: Status[] = ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

const getAuthHeaders = (token: string): HeadersInit => {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const App = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') ?? '');
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem('refreshToken') ?? '');
  const [role, setRole] = useState<UserRole>(() => (localStorage.getItem('role') as UserRole) ?? 'USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const [items, setItems] = useState<JobApplication[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [statusFilter, setStatusFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [drafts, setDrafts] = useState<Record<string, AppFormState>>({});
  const [analytics, setAnalytics] = useState<Record<Status, number>>({
    APPLIED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0
  });

  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [adminTotal, setAdminTotal] = useState(0);
  const [adminPage, setAdminPage] = useState(1);
  const [adminPageSize] = useState(10);

  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('APPLIED');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const adminTotalPages = Math.max(1, Math.ceil(adminTotal / adminPageSize));
  const maxBar = useMemo(() => Math.max(1, ...Object.values(analytics)), [analytics]);

  const setSession = (nextAccessToken: string, nextRefreshToken: string, nextRole: UserRole) => {
    localStorage.setItem('accessToken', nextAccessToken);
    localStorage.setItem('refreshToken', nextRefreshToken);
    localStorage.setItem('role', nextRole);
    setToken(nextAccessToken);
    setRefreshToken(nextRefreshToken);
    setRole(nextRole);
  };

  const clearSession = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('role');
    setToken('');
    setRefreshToken('');
    setRole('USER');
    setItems([]);
    setTotal(0);
    setAdminUsers([]);
    setAdminTotal(0);
    setDrafts({});
  };

  const authApiRequest = async (path: string, options: RequestInit = {}, canRetry = true) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...getAuthHeaders(token), ...(options.headers ?? {}) }
    });

    if (response.status !== 401 || !canRetry || !refreshToken) {
      return response;
    }

    const refreshResponse = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });

    if (!refreshResponse.ok) {
      clearSession();
      setMessage('Session expired. Please login again.');
      return response;
    }

    const refreshedData = await refreshResponse.json();
    localStorage.setItem('accessToken', refreshedData.accessToken);
    localStorage.setItem('refreshToken', refreshedData.refreshToken);
    setToken(refreshedData.accessToken);
    setRefreshToken(refreshedData.refreshToken);

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { ...getAuthHeaders(refreshedData.accessToken), ...(options.headers ?? {}) }
    });
  };

  const fetchApplications = async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter) params.set('status', statusFilter);
    if (companyFilter) params.set('company', companyFilter);

    const response = await authApiRequest(`/api/applications?${params.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to load applications');
    }

    const data: ApplicationsResponse = await response.json();
    setItems(data.items);
    setTotal(data.total);
    setDrafts({});
  };

  const fetchAnalytics = async () => {
    const response = await authApiRequest('/api/applications/analytics');

    if (!response.ok) return;

    const data: AnalyticsResponse = await response.json();
    const next = { APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 };

    for (const bucket of data.byStatus) {
      next[bucket.status] = bucket._count;
    }

    setAnalytics(next);
  };

  const fetchAdminUsers = async () => {
    if (role !== 'ADMIN') return;

    const params = new URLSearchParams({ page: String(adminPage), pageSize: String(adminPageSize) });
    const response = await authApiRequest(`/api/applications/admin/users?${params.toString()}`);
    if (!response.ok) return;

    const data: AdminUsersResponse = await response.json();
    setAdminUsers(data.items);
    setAdminTotal(data.total);
  };

  const loadDashboard = async () => {
    setLoading(true);
    setMessage('');
    try {
      await Promise.all([fetchApplications(), fetchAnalytics(), fetchAdminUsers()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadDashboard();
  }, [token, refreshToken, role, page, statusFilter, companyFilter, adminPage]);

  const logout = () => {
    clearSession();
    setMessage('Logged out');
  };

  const onAuthSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const endpoint = mode === 'login' ? 'login' : 'register';
    const response = await fetch(`${API_BASE_URL}/api/auth/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();
    setLoading(false);

    if (!response.ok) {
      setMessage(data.message ?? 'Authentication failed');
      return;
    }

    if (mode === 'register') {
      setMessage('Registration successful. Verify your email before login.');
      setMode('login');
      return;
    }

    setSession(data.accessToken, data.refreshToken, data.role);
    setMessage('Welcome back');
  };

  const onCreateApplication = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const response = await authApiRequest('/api/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company, title, status, location, notes })
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setMessage(data.message ?? 'Failed to create application');
      return;
    }

    setCompany('');
    setTitle('');
    setStatus('APPLIED');
    setLocation('');
    setNotes('');
    setMessage('Application created');
    await loadDashboard();
  };

  const onDeleteApplication = async (id: string) => {
    const response = await authApiRequest(`/api/applications/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      setMessage('Failed to delete application');
      return;
    }

    setItems((current) => current.filter((item) => item.id !== id));
    setMessage('Application deleted');
    await loadDashboard();
  };

  const toDraft = (application: JobApplication): AppFormState => ({
    company: application.company,
    title: application.title,
    status: application.status,
    location: application.location ?? '',
    notes: application.notes ?? ''
  });

  const onChangeDraft = (id: string, application: JobApplication, key: keyof AppFormState, value: string) => {
    const base = drafts[id] ?? toDraft(application);
    setDrafts((current) => ({ ...current, [id]: { ...base, [key]: value } }));
  };

  const onCancelDraft = (id: string) => {
    setDrafts((current) => {
      const copy = { ...current };
      delete copy[id];
      return copy;
    });
  };

  const onSaveDraft = async (application: JobApplication) => {
    const draft = drafts[application.id];
    if (!draft) return;

    const payload: Partial<AppFormState> = {};
    if (draft.company !== application.company) payload.company = draft.company;
    if (draft.title !== application.title) payload.title = draft.title;
    if (draft.status !== application.status) payload.status = draft.status;
    if (draft.location !== (application.location ?? '')) payload.location = draft.location;
    if (draft.notes !== (application.notes ?? '')) payload.notes = draft.notes;

    if (Object.keys(payload).length === 0) {
      setMessage('No changes to save');
      return;
    }

    const response = await authApiRequest(`/api/applications/${application.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      setMessage('Failed to update application');
      return;
    }

    setMessage('Application updated');
    onCancelDraft(application.id);
    await loadDashboard();
  };

  if (!token) {
    return (
      <main className="container auth-layout">
        <section className="card auth-card">
          <h1>Job Application Tracker</h1>
          <p className="subtitle">{mode === 'login' ? 'Login to your account' : 'Create your account'}</p>
          <form onSubmit={onAuthSubmit} className="form-grid">
            <label>
              Email
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>
            <button type="submit" disabled={loading}>{loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign up'}</button>
          </form>
          <button className="link-button" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
            {mode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login'}
          </button>
          {message ? <p className="message">{message}</p> : null}
        </section>
      </main>
    );
  }

  return (
    <main className="container">
      <header className="header-row">
        <div>
          <h1>Job Application Tracker</h1>
          <p className="subtitle">Track applications, status, and hiring activity</p>
          <p className="role-badge">Role: {role}</p>
        </div>
        <button onClick={logout}>Logout</button>
      </header>

      <section className="grid">
        {STATUS_OPTIONS.map((cardStatus) => (
          <article key={cardStatus} className="card">
            <h3>{cardStatus}</h3>
            <p>{analytics[cardStatus]}</p>
          </article>
        ))}
      </section>

      <section className="card analytics">
        <h2>Status Distribution</h2>
        <ul>
          {STATUS_OPTIONS.map((barStatus) => (
            <li key={barStatus}>
              <span>{barStatus}</span>
              <div className="bar-track">
                <div
                  className="bar-fill"
                  style={{ width: `${(analytics[barStatus] / maxBar) * 100}%` }}
                  aria-label={`${barStatus} ${analytics[barStatus]}`}
                />
              </div>
              <strong>{analytics[barStatus]}</strong>
            </li>
          ))}
        </ul>
      </section>

      <section className="card">
        <h2>Create Application</h2>
        <form onSubmit={onCreateApplication} className="form-grid form-5cols">
          <label>
            Company
            <input value={company} onChange={(event) => setCompany(event.target.value)} required />
          </label>
          <label>
            Title
            <input value={title} onChange={(event) => setTitle(event.target.value)} required />
          </label>
          <label>
            Status
            <select value={status} onChange={(event) => setStatus(event.target.value as Status)}>
              {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Location
            <input value={location} onChange={(event) => setLocation(event.target.value)} />
          </label>
          <label>
            Notes
            <input value={notes} onChange={(event) => setNotes(event.target.value)} />
          </label>
          <button type="submit" disabled={loading}>{loading ? 'Saving...' : 'Save application'}</button>
        </form>
      </section>

      <section className="card">
        <h2>Applications</h2>
        <div className="filters">
          <label>
            Status
            <select
              value={statusFilter}
              onChange={(event) => {
                setPage(1);
                setStatusFilter(event.target.value);
              }}
            >
              <option value="">All</option>
              {STATUS_OPTIONS.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label>
            Company
            <input
              value={companyFilter}
              onChange={(event) => {
                setPage(1);
                setCompanyFilter(event.target.value);
              }}
              placeholder="Search company"
            />
          </label>
        </div>
        <table>
          <thead>
            <tr>
              <th>Company</th>
              <th>Title</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={5}>No applications found.</td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <input
                      value={(drafts[item.id]?.company ?? item.company)}
                      onChange={(event) => onChangeDraft(item.id, item, 'company', event.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      value={(drafts[item.id]?.title ?? item.title)}
                      onChange={(event) => onChangeDraft(item.id, item, 'title', event.target.value)}
                    />
                  </td>
                  <td>
                    <div className="row-actions">
                      <select
                        value={drafts[item.id]?.status ?? item.status}
                        onChange={(event) => onChangeDraft(item.id, item, 'status', event.target.value as Status)}
                      >
                        {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                  </td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="row-actions">
                      <button onClick={() => onSaveDraft(item)} disabled={!drafts[item.id]}>Save</button>
                      <button onClick={() => onCancelDraft(item.id)} disabled={!drafts[item.id]}>Cancel</button>
                      <button className="danger-button" onClick={() => onDeleteApplication(item.id)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div className="pagination">
          <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page === 1}>Previous</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>Next</button>
        </div>
      </section>

      {role === 'ADMIN' ? (
        <section className="card">
          <h2>Admin Users</h2>
          <table>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Verified</th>
                <th>Applications</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {adminUsers.length === 0 ? (
                <tr>
                  <td colSpan={5}>No users found.</td>
                </tr>
              ) : (
                adminUsers.map((user) => (
                  <tr key={user.id}>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{user.isEmailVerified ? 'Yes' : 'No'}</td>
                    <td>{user._count.applications}</td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="pagination">
            <button onClick={() => setAdminPage((current) => Math.max(1, current - 1))} disabled={adminPage === 1}>Previous</button>
            <span>Page {adminPage} of {adminTotalPages}</span>
            <button onClick={() => setAdminPage((current) => Math.min(adminTotalPages, current + 1))} disabled={adminPage >= adminTotalPages}>Next</button>
          </div>
        </section>
      ) : null}

      {message ? <p className="message">{message}</p> : null}
    </main>
  );
};

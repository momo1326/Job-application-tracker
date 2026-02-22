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

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000';
const STATUS_OPTIONS: Status[] = ['APPLIED', 'INTERVIEW', 'OFFER', 'REJECTED'];

const getAuthHeaders = (token: string): HeadersInit => {
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

export const App = () => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [token, setToken] = useState(() => localStorage.getItem('accessToken') ?? '');
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
  const [analytics, setAnalytics] = useState<Record<Status, number>>({
    APPLIED: 0,
    INTERVIEW: 0,
    OFFER: 0,
    REJECTED: 0
  });

  const [company, setCompany] = useState('');
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Status>('APPLIED');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const maxBar = useMemo(() => Math.max(1, ...Object.values(analytics)), [analytics]);

  const authHeaders = getAuthHeaders(token);

  const fetchApplications = async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
    if (statusFilter) params.set('status', statusFilter);
    if (companyFilter) params.set('company', companyFilter);

    const response = await fetch(`${API_BASE_URL}/api/applications?${params.toString()}`, {
      headers: { ...authHeaders }
    });

    if (!response.ok) {
      if (response.status === 401) logout();
      throw new Error('Failed to load applications');
    }

    const data = await response.json();
    setItems(data.items);
    setTotal(data.total);
  };

  const fetchAnalytics = async () => {
    const response = await fetch(`${API_BASE_URL}/api/applications/analytics`, {
      headers: { ...authHeaders }
    });

    if (!response.ok) return;

    const data: AnalyticsResponse = await response.json();
    const next = { APPLIED: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0 };

    for (const bucket of data.byStatus) {
      next[bucket.status] = bucket._count;
    }

    setAnalytics(next);
  };

  const loadDashboard = async () => {
    setLoading(true);
    setMessage('');
    try {
      await Promise.all([fetchApplications(), fetchAnalytics()]);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token) return;
    void loadDashboard();
  }, [token, page, statusFilter, companyFilter]);

  const logout = () => {
    localStorage.removeItem('accessToken');
    setToken('');
    setItems([]);
    setTotal(0);
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

    localStorage.setItem('accessToken', data.accessToken);
    setToken(data.accessToken);
    setMessage('Welcome back');
  };

  const onCreateApplication = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setMessage('');

    const response = await fetch(`${API_BASE_URL}/api/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
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
    const response = await fetch(`${API_BASE_URL}/api/applications/${id}`, {
      method: 'DELETE',
      headers: { ...authHeaders }
    });

    if (!response.ok) {
      setMessage('Failed to delete application');
      return;
    }

    setMessage('Application deleted');
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
                  <td>{item.company}</td>
                  <td>{item.title}</td>
                  <td>{item.status}</td>
                  <td>{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button className="danger-button" onClick={() => onDeleteApplication(item.id)}>Delete</button>
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

      {message ? <p className="message">{message}</p> : null}
    </main>
  );
};

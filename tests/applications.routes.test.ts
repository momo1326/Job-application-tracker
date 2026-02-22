import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createAccessToken } from '../src/utils/tokens.js';

const createApplicationMock = vi.fn();
const listApplicationsMock = vi.fn();
const updateApplicationMock = vi.fn();
const deleteApplicationMock = vi.fn();
const getAnalyticsMock = vi.fn();

vi.mock('../src/services/applicationService.js', () => ({
  createApplication: createApplicationMock,
  listApplications: listApplicationsMock,
  updateApplication: updateApplicationMock,
  deleteApplication: deleteApplicationMock,
  getAnalytics: getAnalyticsMock
}));

const { app } = await import('../src/app.js');

describe('application routes', () => {
  const accessToken = createAccessToken({ sub: 'user_123', role: 'USER' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('GET /api/applications requires auth', async () => {
    const response = await request(app).get('/api/applications');

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Unauthorized');
  });

  it('GET /api/applications returns paginated data', async () => {
    listApplicationsMock.mockResolvedValueOnce({
      items: [{ id: 'app_1', company: 'Acme', title: 'Engineer', status: 'APPLIED' }],
      total: 1,
      page: 1,
      pageSize: 10
    });

    const response = await request(app)
      .get('/api/applications?page=1&pageSize=10&status=APPLIED')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(200);
    expect(response.body.total).toBe(1);
    expect(response.body.items).toHaveLength(1);
    expect(listApplicationsMock).toHaveBeenCalledTimes(1);
  });

  it('POST /api/applications creates a record', async () => {
    createApplicationMock.mockResolvedValueOnce({
      id: 'app_2',
      company: 'Beta Corp',
      title: 'Backend Engineer',
      status: 'INTERVIEW'
    });

    const response = await request(app)
      .post('/api/applications')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ company: 'Beta Corp', title: 'Backend Engineer', status: 'INTERVIEW' });

    expect(response.status).toBe(201);
    expect(response.body.id).toBe('app_2');
    expect(createApplicationMock).toHaveBeenCalledTimes(1);
  });

  it('DELETE /api/applications/:id deletes a record', async () => {
    deleteApplicationMock.mockResolvedValueOnce(undefined);

    const response = await request(app)
      .delete('/api/applications/app_2')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(204);
    expect(deleteApplicationMock).toHaveBeenCalledWith('user_123', 'app_2');
  });
});

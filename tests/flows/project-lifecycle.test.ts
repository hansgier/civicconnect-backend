import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { cleanDatabase } from '../helpers/db.helper';
import { getAuthHeaders } from '../helpers/auth.helper';
import { createBarangay } from '../helpers/factory';
import { ProjectStatus } from '@prisma/client';

// Mock Cloudinary
vi.mock('cloudinary', () => ({
  v2: {
    config: vi.fn(),
    uploader: {
      upload_stream: vi.fn().mockImplementation((_opts, callback) => {
        return {
          end: vi.fn(() => callback(null, { secure_url: 'http://test.url', public_id: 'test-id' })),
        };
      }),
      destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
    },
    api: {
      delete_resources: vi.fn().mockResolvedValue({}),
    }
  },
}));

describe('Flow: Project Lifecycle', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it('should complete a full project lifecycle', async () => {
    // 1. Create project as admin
    const { Authorization } = await getAuthHeaders(app, 'ADMIN' as any);
    const barangay = await createBarangay();

    const createProjectRes = await request(app)
      .post('/api/projects')
      .set('Authorization', Authorization)
      .send({
        title: 'Community Center',
        description: 'New center',
        barangayIds: [barangay.id],
        status: ProjectStatus.PLANNED,
      });

    expect(createProjectRes.status).toBe(201);
    const projectId = createProjectRes.body.project.id;

    // 2. Add project update
    const addUpdateRes = await request(app)
      .post(`/api/projects/${projectId}/updates`)
      .set('Authorization', Authorization)
      .send({
        title: 'Foundation laid',
        description: 'Groundbreaking complete',
      });

    expect(addUpdateRes.status).toBe(201);
    const updateId = addUpdateRes.body.update.id;

    // 3. Upload media (simulated)
    const dummyFile = Buffer.from('dummy-image-data');
    const uploadMediaRes = await request(app)
      .post('/api/media')
      .set('Authorization', Authorization)
      .attach('images', dummyFile, 'test.jpg')
      .field('projectId', projectId);

    expect(uploadMediaRes.status).toBe(201);

    // 4. Add comment
    const addCommentRes = await request(app)
      .post(`/api/projects/${projectId}/comments`)
      .set('Authorization', Authorization)
      .send({
        content: 'Looking forward to this!',
      });

    expect(addCommentRes.status).toBe(201);

    // 5. React
    const reactRes = await request(app)
      .post(`/api/projects/${projectId}/reactions`)
      .set('Authorization', Authorization)
      .send({
        type: 'LIKE',
      });

    expect(reactRes.status).toBe(201);

    // 6. Update status to COMPLETED
    const updateStatusRes = await request(app)
      .patch(`/api/projects/${projectId}`)
      .set('Authorization', Authorization)
      .send({
        status: ProjectStatus.COMPLETED,
      });

    expect(updateStatusRes.status).toBe(200);
    expect(updateStatusRes.body.project.completionDate).toBeDefined();

    // 7. Verify all data is persisted and retrievable
    const getProjectRes = await request(app)
      .get(`/api/projects/${projectId}`)
      .set('Authorization', Authorization);

    expect(getProjectRes.status).toBe(200);
    expect(getProjectRes.body.project.status).toBe(ProjectStatus.COMPLETED);
    
    // Verify updates, comments, and reactions are there
    // (Assuming the GET /projects/:id returns these relations)
    expect(getProjectRes.body.project.updates).toHaveLength(1);
    expect(getProjectRes.body.project.comments).toHaveLength(1);
    expect(getProjectRes.body.project.reactions).toHaveLength(1);
  });
});

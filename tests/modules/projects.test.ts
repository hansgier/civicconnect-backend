import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app';
import { cleanDatabase } from '../helpers/db.helper';
import { getAuthHeaders, createTestUser } from '../helpers/auth.helper';
import { createProject, createBarangay } from '../helpers/factory';
import { UserRole, ProjectStatus, ProjectCategory } from '@prisma/client';

describe('Projects Module', () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  describe('List Projects', () => {
    it('should return paginated projects', async () => {
      const { Authorization } = await getAuthHeaders(app);
      await createProject({ title: 'Project 1' });
      await createProject({ title: 'Project 2' });

      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', Authorization);

      expect(response.status).toBe(200);
      expect(response.body.projects).toBeDefined();
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter by status', async () => {
      const { Authorization } = await getAuthHeaders(app);
      await createProject({ title: 'Ongoing Project', status: ProjectStatus.ONGOING });
      await createProject({ title: 'Planned Project', status: ProjectStatus.PLANNED });

      const response = await request(app)
        .get('/api/projects?status=ONGOING')
        .set('Authorization', Authorization);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].status).toBe('ONGOING');
    });

    it('should filter projects by category', async () => {
      const { Authorization } = await getAuthHeaders(app);
      await createProject({ title: 'Health Project', category: ProjectCategory.HEALTH });
      const response = await request(app).get('/api/projects?category=HEALTH');
      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].category).toBe('HEALTH');
    });

    it('should search by title', async () => {
      const { Authorization } = await getAuthHeaders(app);
      await createProject({ title: 'Specific Title' });
      await createProject({ title: 'Other' });

      const response = await request(app)
        .get('/api/projects?search=Specific')
        .set('Authorization', Authorization);

      expect(response.status).toBe(200);
      expect(response.body.projects).toHaveLength(1);
      expect(response.body.projects[0].title).toBe('Specific Title');
    });

    it('should return 401 for unauthenticated requests', async () => {
      const response = await request(app).get('/api/projects');
      expect(response.status).toBe(401);
    });
  });

  describe('Get Single Project', () => {
    it('should return project with all relations', async () => {
      const { Authorization } = await getAuthHeaders(app);
      const project = await createProject();

      const response = await request(app)
        .get(`/api/projects/${project.id}`)
        .set('Authorization', Authorization);

      expect(response.status).toBe(200);
      expect(response.body.project.id).toBe(project.id);
      expect(response.body.project.createdBy).toBeDefined();
    });

    it('should return 404 for non-existent project', async () => {
      const { Authorization } = await getAuthHeaders(app);
      const response = await request(app)
        .get('/api/projects/00000000-0000-0000-0000-000000000000')
        .set('Authorization', Authorization);

      expect(response.status).toBe(404);
    });
  });

  describe('Create Project', () => {
    it('should create project as admin', async () => {
      const { Authorization } = await getAuthHeaders(app, UserRole.ADMIN);
      const barangay = await createBarangay();

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', Authorization)
        .send({
          title: 'Admin Created Project',
          description: 'Description',
          barangayIds: [barangay.id],
          status: ProjectStatus.PLANNED,
        });

      expect(response.status).toBe(201);
      expect(response.body.project.title).toBe('Admin Created Project');
    });

    it('should return 403 for citizen role', async () => {
      const { Authorization } = await getAuthHeaders(app, UserRole.CITIZEN);
      
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', Authorization)
        .send({
          title: 'Citizen Project',
          description: 'Should fail',
          barangayIds: [],
        });

      expect(response.status).toBe(403);
    });

    it('should return 409 for duplicate title', async () => {
      const { Authorization } = await getAuthHeaders(app, UserRole.ADMIN);
      const barangay = await createBarangay();
      await createProject({ title: 'Duplicate Title' });

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', Authorization)
        .send({
          title: 'Duplicate Title',
          description: 'Description',
          barangayIds: [barangay.id],
        });

      expect(response.status).toBe(409);
    });
  });

  describe('Update Project', () => {
    it('should update project fields', async () => {
      const { Authorization } = await getAuthHeaders(app, UserRole.ADMIN);
      const project = await createProject();

      const response = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set('Authorization', Authorization)
        .send({
          title: 'Updated Title',
        });

      expect(response.status).toBe(200);
      expect(response.body.project.title).toBe('Updated Title');
    });

    it('should auto-set completionDate when status changes to COMPLETED', async () => {
      const { Authorization } = await getAuthHeaders(app, UserRole.ADMIN);
      const project = await createProject({ status: ProjectStatus.ONGOING });

      const response = await request(app)
        .patch(`/api/projects/${project.id}`)
        .set('Authorization', Authorization)
        .send({
          status: ProjectStatus.COMPLETED,
        });

      expect(response.status).toBe(200);
      expect(response.body.project.completionDate).toBeDefined();
    });
  });

  describe('Delete Project', () => {
    it('should delete project', async () => {
      const { Authorization } = await getAuthHeaders(app, UserRole.ADMIN);
      const project = await createProject();

      const response = await request(app)
        .delete(`/api/projects/${project.id}`)
        .set('Authorization', Authorization);

      expect(response.status).toBe(200);
      
      const deletedProject = await prisma.project.findUnique({ where: { id: project.id } });
      expect(deletedProject).toBeNull();
    });
  });
});

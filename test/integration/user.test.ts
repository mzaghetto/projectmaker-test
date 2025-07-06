import request from 'supertest';
import { AppDataSource } from '../../src/db';
import { app, server } from '../../src/index';

import { User, UserRole } from '../../src/models/User';
import { logger } from '../../src/utils/logger';
import { createAdminUser } from '../../src/utils/createAdminUser';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../../src/services/UserService';

let adminUser: User;
let editorUser: User;
let viewerUser: User;
let userService: UserService;

describe('User API', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
    userService = new UserService();
  });

  beforeEach(async () => {
    await AppDataSource.synchronize(true); // Clear and re-sync database for each test
    adminUser = await createAdminUser(AppDataSource);

    editorUser = await userService.createUser(
      'Editor User',
      `editor-${Date.now()}@test.com`,
      UserRole.EDITOR
    );

    viewerUser = await userService.createUser(
      'Viewer User',
      `viewer-${Date.now()}@test.com`,
      UserRole.VIEWER
    );
  });

  afterEach(async () => {
    // Limpar dados após cada teste
    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.clear();
    }
  });

  afterAll(async () => {
    await AppDataSource.destroy();
    server.close();
    logger.end();
  });

  it('should allow ADMIN to create a new user with Viewer role', async () => {
    const uniqueEmail = `viewer-${uuidv4()}@example.com`;
    const res = await request(app)
      .post('/api/users')
      .set('x-user-id', adminUser.id)
      .send({
        name: 'Viewer User',
        email: uniqueEmail,
        role: 'Viewer',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('Viewer User');
    expect(res.body.email).toEqual(uniqueEmail);
    expect(res.body.role).toEqual('Viewer');
  });

  it('should allow ADMIN to create a new user with Editor role', async () => {
    const uniqueEmail = `editor-${uuidv4()}@example.com`;
    const res = await request(app)
      .post('/api/users')
      .set('x-user-id', adminUser.id)
      .send({
        name: 'Editor User',
        email: uniqueEmail,
        role: 'Editor',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('Editor User');
    expect(res.body.email).toEqual(uniqueEmail);
    expect(res.body.role).toEqual('Editor');
  });

  it('should allow ADMIN to create a new user with Admin role', async () => {
    const uniqueEmail = `newadmin-${uuidv4()}@example.com`;
    const res = await request(app)
      .post('/api/users')
      .set('x-user-id', adminUser.id)
      .send({
        name: 'New Admin User',
        email: uniqueEmail,
        role: 'Admin',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('New Admin User');
    expect(res.body.email).toEqual(uniqueEmail);
    expect(res.body.role).toEqual('Admin');
  });

  it('should prevent EDITOR from creating a new user', async () => {
    const uniqueEmail = `editor-create-${uuidv4()}@example.com`;
    const res = await request(app)
      .post('/api/users')
      .set('x-user-id', editorUser.id)
      .send({
        name: 'Editor Creating User',
        email: uniqueEmail,
        role: 'Viewer',
      });
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Forbidden: Insufficient permissions');
    expect(res.body.error).toContain('Required roles: Admin');
  });

  it('should prevent VIEWER from creating a new user', async () => {
    const uniqueEmail = `viewer-create-${uuidv4()}@example.com`;
    const res = await request(app)
      .post('/api/users')
      .set('x-user-id', viewerUser.id)
      .send({
        name: 'Viewer Creating User',
        email: uniqueEmail,
        role: 'Viewer',
      });
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Forbidden: Insufficient permissions');
    expect(res.body.error).toContain('Required roles: Admin');
  });

  it('should prevent unauthenticated users from creating a new user', async () => {
    const uniqueEmail = `unauth-create-${uuidv4()}@example.com`;
    const res = await request(app)
      .post('/api/users')
      .send({
        name: 'Unauthenticated User',
        email: uniqueEmail,
        role: 'Viewer',
      });
    expect(res.statusCode).toEqual(401);
  });

  it('should allow ADMIN to get all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('x-user-id', adminUser.id);

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(3); // Admin, Editor, Viewer
  });

  it('should prevent EDITOR from getting all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('x-user-id', editorUser.id);

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Forbidden: Insufficient permissions');
    expect(res.body.error).toContain('Required roles: Admin');
  });

  it('should prevent VIEWER from getting all users', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('x-user-id', viewerUser.id);

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Forbidden: Insufficient permissions');
    expect(res.body.error).toContain('Required roles: Admin');
  });

  it('should prevent unauthenticated users from getting all users', async () => {
    const res = await request(app)
      .get('/api/users');

    expect(res.statusCode).toEqual(401);
  });

  it('should allow ADMIN to get a user by ID', async () => {
    const getRes = await request(app)
      .get(`/api/users/${editorUser.id}`)
      .set('x-user-id', adminUser.id);

    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.id).toEqual(editorUser.id);
    expect(getRes.body.name).toEqual(editorUser.name);
  });

  it('should prevent EDITOR from getting their own user by ID', async () => {
    const getRes = await request(app)
      .get(`/api/users/${editorUser.id}`)
      .set('x-user-id', editorUser.id);

    expect(getRes.statusCode).toEqual(403);
    expect(getRes.body.error).toContain('Forbidden: Insufficient permissions');
    expect(getRes.body.error).toContain('Required roles: Admin');
  });

  it('should prevent VIEWER from getting their own user by ID', async () => {
    const getRes = await request(app)
      .get(`/api/users/${viewerUser.id}`)
      .set('x-user-id', viewerUser.id);

    expect(getRes.statusCode).toEqual(403);
    expect(getRes.body.error).toContain('Forbidden: Insufficient permissions');
    expect(getRes.body.error).toContain('Required roles: Admin');
  });

  it('should prevent EDITOR from getting another user by ID', async () => {
    const getRes = await request(app)
      .get(`/api/users/${adminUser.id}`)
      .set('x-user-id', editorUser.id);

    expect(getRes.statusCode).toEqual(403);
    expect(getRes.body.error).toContain('Forbidden: Insufficient permissions');
    expect(getRes.body.error).toContain('Required roles: Admin');
  });

  it('should prevent VIEWER from getting another user by ID', async () => {
    const getRes = await request(app)
      .get(`/api/users/${adminUser.id}`)
      .set('x-user-id', viewerUser.id);

    expect(getRes.statusCode).toEqual(403);
    expect(getRes.body.error).toContain('Forbidden: Insufficient permissions');
    expect(getRes.body.error).toContain('Required roles: Admin');
  });

  it('should prevent unauthenticated users from getting a user by ID', async () => {
    const getRes = await request(app)
      .get(`/api/users/${adminUser.id}`);

    expect(getRes.statusCode).toEqual(401);
  });
});
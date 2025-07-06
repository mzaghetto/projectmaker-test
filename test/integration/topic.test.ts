import request from 'supertest';
import { AppDataSource } from '../../src/db';
import { app, server } from '../../src/index';
import { createAdminUser } from '../../src/utils/createAdminUser';
import { User, UserRole } from '../../src/models/User';
import { logger } from '../../src/utils/logger';
import { UserService } from '../../src/services/UserService';
import { TopicService } from '../../src/services/TopicService';

let adminUser: User;
let editorUser: User;
let viewerUser: User;
let userService: UserService;
let topicService: TopicService;

describe('Topic API', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true);

    userService = new UserService();
    topicService = new TopicService();
  });

  beforeEach(async () => {
    const entities = AppDataSource.entityMetadatas;
    for (const entity of entities) {
      const repository = AppDataSource.getRepository(entity.name);
      await repository.clear();
    }

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

  it('should create a new topic', async () => {
    const res = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Test Topic',
        content: 'This is a test topic.',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('Test Topic');
  });

  it('should get a topic by ID', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic to Get',
        content: 'Content of topic to get.',
      });
    const topicId = createRes.body.id;

    const getRes = await request(app)
      .get(`/api/topics/${topicId}`)
      .set('x-user-id', adminUser.id.toString());

    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.id).toEqual(topicId);
    expect(getRes.body.name).toEqual('Topic to Get');
  });

  it('should update a topic and create a new version', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic to Update',
        content: 'Original content.',
      });
    const topicId = createRes.body.id;
    const originalVersion = createRes.body.version;
    const newName = 'Updated Topic';
    const content = 'Updated content.';

    const updateRes = await request(app)
      .put(`/api/topics/${topicId}`)
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: newName,
        content: content,
      });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.id).not.toEqual(topicId);
    expect(updateRes.body.name).toEqual(newName);
    expect(updateRes.body.content).toEqual(content);
    expect(updateRes.body.version).toBe(originalVersion + 1);
    expect(updateRes.body.version).toBeGreaterThan(originalVersion);
  });

  it('should get all versions of a topic', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Versioned Topic',
        content: 'Version 1 content.',
      });
    const topicId = createRes.body.id;

    await request(app)
      .put(`/api/topics/${topicId}`)
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Versioned Topic',
        content: 'Version 2 content.',
      });

    const getVersionsRes = await request(app)
      .get(`/api/topics/${topicId}/versions`)
      .set('x-user-id', adminUser.id.toString());

    expect(getVersionsRes.statusCode).toEqual(200);
    expect(Array.isArray(getVersionsRes.body)).toBe(true);
    expect(getVersionsRes.body.length).toBeGreaterThanOrEqual(2);
    expect(getVersionsRes.body[1].content).toEqual('Version 1 content.');
    expect(getVersionsRes.body[0].content).toEqual('Version 2 content.');
  });

  it('should get all topics', async () => {
    await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic 1 for All',
        content: 'Content 1.',
      });
    await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic 2 for All',
        content: 'Content 2.',
      });

    const res = await request(app)
      .get('/api/topics')
      .set('x-user-id', adminUser.id.toString());

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should retrieve a topic and its subtopics recursively', async () => {
    const parentRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Parent Topic',
        content: 'Parent content.',
      });
    const parentId = parentRes.body.id;

    const child1Res = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Child Topic 1',
        content: 'Child 1 content.',
        parentTopicId: parentId,
      });
    const child1Id = child1Res.body.id;

    await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Grandchild Topic 1',
        content: 'Grandchild 1 content.',
        parentTopicId: child1Id,
      });

    const res = await request(app)
      .get(`/api/topics/${parentId}/tree`)
      .set('x-user-id', adminUser.id.toString());

    expect(res.statusCode).toEqual(200);
    expect(res.body.name).toEqual('Parent Topic');
    expect(res.body.children).toHaveLength(1);
    expect(res.body.children[0].name).toBe('Child Topic 1');
    expect(res.body.children[0].children).toHaveLength(1);
    expect(res.body.children[0].children[0].name).toBe('Grandchild Topic 1');
  });

  it('should find the shortest path between two topics', async () => {
    const topicA = (await request(app).post('/api/topics').set('x-user-id', adminUser.id.toString()).send({ name: 'Topic A', content: 'A' })).body;
    const topicB = (await request(app).post('/api/topics').set('x-user-id', adminUser.id.toString()).send({ name: 'Topic B', content: 'B', parentTopicId: topicA.id })).body;
    const topicC = (await request(app).post('/api/topics').set('x-user-id', adminUser.id.toString()).send({ name: 'Topic C', content: 'C', parentTopicId: topicB.id })).body;
    const topicD = (await request(app).post('/api/topics').set('x-user-id', adminUser.id.toString()).send({ name: 'Topic D', content: 'D', parentTopicId: topicA.id })).body;
    const topicE = (await request(app).post('/api/topics').set('x-user-id', adminUser.id.toString()).send({ name: 'Topic E', content: 'E', parentTopicId: topicD.id })).body;

    const res = await request(app)
      .get(`/api/topics/path?startTopicId=${topicA.id}&endTopicId=${topicC.id}`)
      .set('x-user-id', adminUser.id.toString());

    expect(res.statusCode).toEqual(200);
    expect(res.body.map((t: any) => t.id)).toEqual([topicA.id, topicB.id, topicC.id]);

    const res2 = await request(app)
      .get(`/api/topics/path?startTopicId=${topicA.id}&endTopicId=${topicE.id}`)
      .set('x-user-id', adminUser.id.toString());

    expect(res2.statusCode).toEqual(200);
    expect(res2.body.map((t: any) => t.id)).toEqual([topicA.id, topicD.id, topicE.id]);
  });

  it('should allow EDITOR to create a new topic', async () => {
    const res = await request(app)
      .post('/api/topics')
      .set('x-user-id', editorUser.id.toString())
      .send({
        name: 'Editor Topic',
        content: 'This is a topic created by an editor.',
      });
    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toEqual('Editor Topic');
  });

  it('should prevent VIEWER from creating a topic', async () => {
    const res = await request(app)
      .post('/api/topics')
      .set('x-user-id', viewerUser.id.toString())
      .send({
        name: 'Viewer Topic',
        content: 'This topic should not be created by a viewer.',
      });
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Forbidden: Insufficient permissions');
    expect(res.body.error).toContain('Required roles: Admin, Editor');
  });

  it('should prevent unauthenticated users from creating a topic', async () => {
    const res = await request(app)
      .post('/api/topics')
      .send({
        name: 'Unauthorized Topic',
        content: 'This topic should not be created by an unauthenticated user.',
      });
    expect(res.statusCode).toEqual(401);
  });

  it('should allow EDITOR to update a topic', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic to be updated by Editor',
        content: 'Original content.',
      });
    const topicId = createRes.body.id;
    const originalVersion = createRes.body.version;
    const newName = 'Updated by Editor';

    const updateRes = await request(app)
      .put(`/api/topics/${topicId}`)
      .set('x-user-id', editorUser.id.toString())
      .send({
        name: newName,
        content: 'Content updated by editor.',
      });

    expect(updateRes.statusCode).toEqual(200);
    expect(updateRes.body.name).toEqual(newName);
    expect(updateRes.body.version).toBe(originalVersion + 1);
  });

  it('should prevent VIEWER from updating a topic', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic to be updated by Viewer',
        content: 'Original content.',
      });
    const topicId = createRes.body.id;

    const updateRes = await request(app)
      .put(`/api/topics/${topicId}`)
      .set('x-user-id', viewerUser.id.toString())
      .send({
        name: 'Updated by Viewer',
        content: 'Content updated by viewer.',
      });

    expect(updateRes.statusCode).toEqual(403);
    expect(updateRes.body.error).toContain('Forbidden: Insufficient permissions');
    expect(updateRes.body.error).toContain('Required roles: Admin, Editor');
  });

  it('should prevent unauthenticated users from updating a topic', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic to be updated by Unauthorized',
        content: 'Original content.',
      });
    const topicId = createRes.body.id;

    const updateRes = await request(app)
      .put(`/api/topics/${topicId}`)
      .send({
        name: 'Updated by Unauthorized',
        content: 'Content updated by unauthorized.',
      });

    expect(updateRes.statusCode).toEqual(401);
  });

  it('should allow VIEWER to get a topic by ID', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic for Viewer to Get',
        content: 'Content of topic for viewer.',
      });
    const topicId = createRes.body.id;

    const getRes = await request(app)
      .get(`/api/topics/${topicId}`)
      .set('x-user-id', viewerUser.id.toString());

    expect(getRes.statusCode).toEqual(200);
    expect(getRes.body.id).toEqual(topicId);
    expect(getRes.body.name).toEqual('Topic for Viewer to Get');
  });

  it('should allow VIEWER to get all versions of a topic', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Versioned Topic for Viewer',
        content: 'Version 1 content.',
      });
    const topicId = createRes.body.id;

    await request(app)
      .put(`/api/topics/${topicId}`)
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Versioned Topic for Viewer',
        content: 'Version 2 content.',
      });

    const getVersionsRes = await request(app)
      .get(`/api/topics/${topicId}/versions`)
      .set('x-user-id', viewerUser.id.toString());

    expect(getVersionsRes.statusCode).toEqual(200);
    expect(Array.isArray(getVersionsRes.body)).toBe(true);
    expect(getVersionsRes.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should allow VIEWER to get all topics', async () => {
    await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic for Viewer All 1',
        content: 'Content 1.',
      });
    await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic for Viewer All 2',
        content: 'Content 2.',
      });

    const res = await request(app)
      .get('/api/topics')
      .set('x-user-id', viewerUser.id.toString());

    expect(res.statusCode).toEqual(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
  });

  it('should prevent unauthenticated users from getting a topic by ID', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic for Unauthorized Get',
        content: 'Content of topic for unauthorized.',
      });
    const topicId = createRes.body.id;

    const getRes = await request(app)
      .get(`/api/topics/${topicId}`);

    expect(getRes.statusCode).toEqual(401);
  });

  it('should prevent unauthenticated users from getting all versions of a topic', async () => {
    const createRes = await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Versioned Topic for Unauthorized',
        content: 'Version 1 content.',
      });
    const topicId = createRes.body.id;

    const getVersionsRes = await request(app)
      .get(`/api/topics/${topicId}/versions`);

    expect(getVersionsRes.statusCode).toEqual(401);
  });

  it('should prevent unauthenticated users from getting all topics', async () => {
    await request(app)
      .post('/api/topics')
      .set('x-user-id', adminUser.id.toString())
      .send({
        name: 'Topic for Unauthorized All',
        content: 'Content.',
      });

    const res = await request(app)
      .get('/api/topics');

    expect(res.statusCode).toEqual(401);
  });
});

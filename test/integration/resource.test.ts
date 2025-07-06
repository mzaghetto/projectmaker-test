import request from 'supertest';
import { AppDataSource } from '../../src/db';
import { app, server } from '../../src/index';
import { createAdminUser } from '../../src/utils/createAdminUser';
import { User } from '../../src/models/User';
import { logger } from '../../src/utils/logger';
import { TopicService } from '../../src/services/TopicService';
import { UserService } from '../../src/services/UserService';
import { UserRole } from '../../src/models/User';

let adminUser: User;
let editorUser: User;
let viewerUser: User;
let topicService: TopicService;
let userService: UserService;

describe('Resource API', () => {
  beforeAll(async () => {
    await AppDataSource.initialize();
    await AppDataSource.synchronize(true);

    userService = new UserService();
    topicService = new TopicService();
  });

  beforeEach(async () => {
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

  it('should allow ADMIN to create a new resource', async () => {
    const topic = await topicService.createTopic('Test Topic', 'Test Content');

    const res = await request(app)
      .post('/api/resources')
      .set('x-user-id', adminUser.id.toString())
      .send({
        topicId: topic.id,
        url: 'http://example.com/resource1',
        description: 'First resource',
        type: 'article',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.topicId).toEqual(topic.id);
  });

  it('should allow EDITOR to create a new resource', async () => {
    const topic = await topicService.createTopic('Test Topic', 'Test Content');


    const res = await request(app)
      .post('/api/resources')
      .set('x-user-id', editorUser.id.toString())
      .send({
        topicId: topic.id,
        url: 'http://example.com/resource1',
        description: 'First resource',
        type: 'article',
      });

    expect(res.statusCode).toEqual(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.topicId).toEqual(topic.id);
  });

  it('should prevent VIEWER from creating a resource', async () => {
    const topic = await topicService.createTopic('Test Topic', 'Test Content');

    const res = await request(app)
      .post('/api/resources')
      .set('x-user-id', viewerUser.id.toString())
      .send({
        topicId: topic.id,
        url: 'http://example.com/resource1',
        description: 'First resource',
        type: 'article',
      });

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toContain('Forbidden: Insufficient permissions');
    expect(res.body.error).toContain('Required roles: Admin, Editor');
  });

  it('should prevent unauthenticated users from creating a resource', async () => {
    const res = await request(app)
      .post('/api/resources')
      .send({
        topicId: 'any-topic-id',
        url: 'http://example.com/resource1',
        description: 'First resource',
        type: 'article',
      });

    expect(res.statusCode).toEqual(401);
  });

  it('should return 404 if topicId does not exist when creating a resource', async () => {
    const res = await request(app)
      .post('/api/resources')
      .set('x-user-id', adminUser.id.toString())
      .send({
        topicId: 'non-existent-topic-id',
        url: 'http://example.com/resource1',
        description: 'First resource',
        type: 'article',
      });

    expect(res.statusCode).toEqual(404);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toContain('Topic with ID');
    expect(res.body.error).toContain('not found');
  });

  it('should allow VIEWER to get resources by topicId', async () => {
    const topic = await topicService.createTopic('Test Topic', 'Test Content');

    await request(app)
      .post('/api/resources')
      .set('x-user-id', adminUser.id.toString())
      .send({
        topicId: topic.id,
        url: 'http://example.com/resource1',
        description: 'First resource',
        type: 'article',
      });

    await request(app)
      .post('/api/resources')
      .set('x-user-id', adminUser.id.toString())
      .send({
        topicId: topic.id,
        url: 'http://example.com/resource2',
        description: 'Second resource',
        type: 'video',
      });

    const res = await request(app)
      .get(`/api/topics/${topic.id}/resources`)
      .set('x-user-id', adminUser.id.toString());

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0].topicId).toEqual(topic.id);
    expect(res.body[1].topicId).toEqual(topic.id);
  });

  it('should allow EDITOR to get resources by topicId', async () => {
    const topic = await topicService.createTopic('Test Topic', 'Test Content');

    await request(app)
      .post('/api/resources')
      .set('x-user-id', adminUser.id.toString())
      .send({
        topicId: topic.id,
        url: 'http://example.com/resource1',
        description: 'First resource',
        type: 'article',
      });

    const res = await request(app)
      .get(`/api/topics/${topic.id}/resources`)
      .set('x-user-id', editorUser.id.toString());

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(1);
  });

  it('should allow ADMIN to get resources by topicId', async () => {
    const topic = await topicService.createTopic('Test Topic', 'Test Content');

    await request(app)
      .post('/api/resources')
      .set('x-user-id', adminUser.id.toString())
      .send({
        topicId: topic.id,
        url: 'http://example.com/resource1',
        description: 'First resource',
        type: 'article',
      });

    const res = await request(app)
      .get(`/api/topics/${topic.id}/resources`)
      .set('x-user-id', adminUser.id.toString());

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(1);
  });

  it('should prevent unauthenticated users from getting resources', async () => {
    const res = await request(app)
      .get('/api/topics/any-topic-id/resources');

    expect(res.statusCode).toEqual(401);
  });

  it('should return an empty array if no resources are found for a topic', async () => {
    const topic = await topicService.createTopic('Empty Topic', 'No resources');

    const res = await request(app)
      .get(`/api/topics/${topic.id}/resources`)
      .set('x-user-id', adminUser.id.toString());

    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveLength(0);
  });
});

import { TopicService } from './TopicService';
import { Topic } from '../models/Topic';
import { AppDataSource } from '../db';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { TopicBuilder } from '../models/TopicBuilder';
import { TopicComposite } from '../models/TopicComposite';

jest.mock('../db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('TopicService', () => {
  let topicService: TopicService;
  let topicRepository: jest.Mocked<Repository<Topic>>;
  let queryBuilder: jest.Mocked<SelectQueryBuilder<Topic>>;

  beforeEach(() => {
    queryBuilder = {
      distinctOn: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      getMany: jest.fn(),
      getOne: jest.fn(),
    } as unknown as jest.Mocked<SelectQueryBuilder<Topic>>;

    topicRepository = {
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
      createQueryBuilder: jest.fn(() => queryBuilder),
    } as unknown as jest.Mocked<Repository<Topic>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(topicRepository);
    topicService = new TopicService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new topic', async () => {
    const topic = new TopicBuilder()
      .withName('Test Topic')
      .withContent('Test Content')
      .build();
    topicRepository.save.mockResolvedValue(topic);

    const result = await topicService.createTopic('Test Topic', 'Test Content');

    expect(result.name).toBe('Test Topic');
    expect(result.content).toBe('Test Content');
    expect(topicRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Test Topic',
        content: 'Test Content',
      }),
    );
  });

  it('should create a new topic with parent topic', async () => {
    const parentTopic = new TopicBuilder()
      .withId('parent-id')
      .withTopicGroupId('parent-group-id')
      .withName('Parent Topic')
      .withContent('Parent Content')
      .build();

    const childTopic = new TopicBuilder()
      .withName('Child Topic')
      .withContent('Child Content')
      .withParentTopicGroupId('parent-group-id')
      .build();

    topicRepository.findOneBy.mockResolvedValueOnce(parentTopic);
    queryBuilder.getOne.mockResolvedValueOnce(parentTopic);
    topicRepository.save.mockResolvedValue(childTopic);

    const result = await topicService.createTopic(
      'Child Topic',
      'Child Content',
      'parent-id',
    );

    expect(result.name).toBe('Child Topic');
    expect(result.content).toBe('Child Content');
    expect(topicRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Child Topic',
        content: 'Child Content',
        parentTopicGroupId: 'parent-group-id',
      }),
    );
  });

  it('should create a new topic when parent topic is not found', async () => {
    const childTopic = new TopicBuilder()
      .withName('Child Topic')
      .withContent('Child Content')
      .build();

    // Mock parent topic not found
    topicRepository.findOneBy.mockResolvedValueOnce(null);
    topicRepository.save.mockResolvedValue(childTopic);

    const result = await topicService.createTopic(
      'Child Topic',
      'Child Content',
      'nonexistent-parent-id',
    );

    expect(result.name).toBe('Child Topic');
    expect(result.content).toBe('Child Content');
    expect(topicRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Child Topic',
        content: 'Child Content',
        parentTopicGroupId: undefined,
      }),
    );
  });

  it('should return all topics', async () => {
    const topics = [
      new TopicBuilder().withName('Topic 1').build(),
      new TopicBuilder().withName('Topic 2').build(),
    ];
    topicRepository.find.mockResolvedValue(topics);

    const result = await topicService.getTopics();

    expect(result).toEqual(topics);
    expect(topicRepository.find).toHaveBeenCalled();
  });

  it('should return a topic by id', async () => {
    const topic = new TopicBuilder().withId('1').build();
    topicRepository.findOneBy.mockResolvedValue(topic);

    const result = await topicService.getTopicById('1');

    expect(result).toEqual(topic);
    expect(topicRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
  });

  it('should update a topic and create a new version', async () => {
    const existingTopic = new TopicBuilder()
      .withId('1')
      .withName('Old Name')
      .withContent('Old Content')
      .build();

    topicRepository.findOneBy.mockResolvedValue(existingTopic);
    topicRepository.save.mockResolvedValue(existingTopic);

    const result = await topicService.updateTopic(
      '1',
      'New Name',
      'New Content',
    );

    expect(result).toBeDefined();
    expect(result!.name).toBe('New Name');
    expect(result!.content).toBe('New Content');
    expect(result!.version).toBe(existingTopic.version + 1);
    expect(topicRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Name',
        content: 'New Content',
      }),
    );
  });

  it('should return undefined if topic to update is not found', async () => {
    topicRepository.findOneBy.mockResolvedValue(null);
    const result = await topicService.updateTopic(
      '1',
      'New Name',
      'New Content',
    );
    expect(result).toBeUndefined();
  });

  it('should return all versions of a topic', async () => {
    const topic1 = new TopicBuilder()
      .withTopicGroupId('group1')
      .withVersion(1)
      .build();
    const topic2 = new TopicBuilder()
      .withTopicGroupId('group1')
      .withVersion(2)
      .build();
    topicRepository.findOneBy.mockResolvedValue(topic1);
    topicRepository.find.mockResolvedValue([topic2, topic1]);

    const result = await topicService.getTopicVersions('1');

    expect(result).toEqual([topic2, topic1]);
    expect(topicRepository.find).toHaveBeenCalledWith({
      where: { topicGroupId: 'group1' },
      order: { version: 'DESC' },
    });
  });

  it('should return an empty array if topic for versions is not found', async () => {
    topicRepository.findOneBy.mockResolvedValue(null);
    const result = await topicService.getTopicVersions('1');
    expect(result).toEqual([]);
  });

  it('should return the topic tree', async () => {
    const rootTopic = new TopicBuilder()
      .withId('root')
      .withTopicGroupId('groupRoot')
      .build();
    const childTopic = new TopicBuilder()
      .withId('child')
      .withTopicGroupId('groupChild')
      .withParentTopicGroupId('groupRoot')
      .build();

    topicRepository.findOneBy.mockResolvedValue(rootTopic);
    queryBuilder.getOne.mockResolvedValue(rootTopic); // for latest version
    topicRepository.find
      .mockResolvedValueOnce([childTopic])
      .mockResolvedValueOnce([]);

    const tree = await topicService.getTopicTree('root');

    expect(tree).toBeInstanceOf(TopicComposite);
    expect(tree?.id).toBe('root');
    expect(tree?.children.length).toBe(1);
    expect(tree?.children[0].id).toBe('child');
  });

  it('should only include latest version of each topic group in tree', async () => {
    const rootTopic = new TopicBuilder()
      .withId('root')
      .withTopicGroupId('groupRoot')
      .build();

    const childV1 = new TopicBuilder()
      .withId('child-v1')
      .withTopicGroupId('groupChild')
      .withVersion(1)
      .withParentTopicGroupId('groupRoot')
      .build();

    const childV2 = new TopicBuilder()
      .withId('child-v2')
      .withTopicGroupId('groupChild')
      .withVersion(2)
      .withParentTopicGroupId('groupRoot')
      .build();

    const otherChild = new TopicBuilder()
      .withId('other-child')
      .withTopicGroupId('groupOther')
      .withParentTopicGroupId('groupRoot')
      .build();

    topicRepository.findOneBy.mockResolvedValue(rootTopic);
    queryBuilder.getOne.mockResolvedValue(rootTopic);

    topicRepository.find.mockImplementation(async (options: any) => {
      if (options?.where?.parentTopicGroupId === 'groupRoot') {
        return [childV2, childV1, otherChild];
      }
      return [];
    });

    const tree = await topicService.getTopicTree('root');

    expect(tree).toBeInstanceOf(TopicComposite);
    expect(tree?.children.length).toBe(2);
    expect(tree?.children.some((c) => c.id === 'child-v2')).toBeTruthy();
    expect(tree?.children.some((c) => c.id === 'other-child')).toBeTruthy();
    expect(tree?.children.some((c) => c.id === 'child-v1')).toBeFalsy();
  });

  it('should return undefined if topic for tree is not found', async () => {
    topicRepository.findOneBy.mockResolvedValue(null);
    const result = await topicService.getTopicTree('1');
    expect(result).toBeUndefined();
  });

  it('should return undefined from getTopicTree if latestTopicVersion is not found', async () => {
    const rootTopic = new TopicBuilder()
      .withId('root')
      .withTopicGroupId('groupRoot')
      .build();
    topicRepository.findOneBy.mockResolvedValue(rootTopic);
    queryBuilder.getOne.mockResolvedValue(null);

    const result = await topicService.getTopicTree('root');

    expect(result).toBeUndefined();
  });

  it('should find the shortest path between two topics', async () => {
    const topicA = new TopicBuilder()
      .withId('A')
      .withTopicGroupId('groupA')
      .build();
    const topicB = new TopicBuilder()
      .withId('B')
      .withTopicGroupId('groupB')
      .withParentTopicGroupId('groupA')
      .build();
    const topicC = new TopicBuilder()
      .withId('C')
      .withTopicGroupId('groupC')
      .withParentTopicGroupId('groupB')
      .build();

    topicRepository.findOneBy.mockImplementation(async (criteria: any) => {
      if (criteria.id === 'A') return topicA;
      if (criteria.id === 'C') return topicC;
      return null;
    });

    (queryBuilder.getOne as jest.Mock).mockImplementation(async () => {
      const whereClause = (queryBuilder.where as jest.Mock).mock.calls.slice(
        -1,
      )[0][1];
      if (whereClause.topicGroupId === 'groupA') return topicA;
      if (whereClause.topicGroupId === 'groupB') return topicB;
      if (whereClause.topicGroupId === 'groupC') return topicC;
      return null;
    });

    (queryBuilder.getMany as jest.Mock).mockImplementation(async () => {
      const whereClause = (queryBuilder.where as jest.Mock).mock.calls.slice(
        -1,
      )[0][1];
      if (whereClause.parentTopicGroupId === 'groupA') return [topicB];
      if (whereClause.parentTopicGroupId === 'groupB') return [topicC];
      return [];
    });

    const path = await topicService.findShortestPath('A', 'C');
    expect(path).not.toBeNull();
    expect(path!.map((p) => p.id)).toEqual(['A', 'B', 'C']);
  });

  it('should return a path with a single topic if start and end are the same', async () => {
    const topicA = new TopicBuilder()
      .withId('A')
      .withTopicGroupId('groupA')
      .build();

    topicRepository.findOneBy.mockResolvedValue(topicA);
    (queryBuilder.getOne as jest.Mock).mockResolvedValue(topicA);

    const path = await topicService.findShortestPath('A', 'A');

    expect(path).not.toBeNull();
    expect(path!.length).toBe(1);
    expect(path![0].id).toBe('A');
  });

  it('should return null if no path is found', async () => {
    const topicA = new TopicBuilder()
      .withId('A')
      .withTopicGroupId('groupA')
      .build();
    const topicC = new TopicBuilder()
      .withId('C')
      .withTopicGroupId('groupC')
      .build();

    topicRepository.findOneBy.mockImplementation(async (criteria: any) => {
      if (criteria.id === 'A') return topicA;
      if (criteria.id === 'C') return topicC;
      return null;
    });

    (queryBuilder.getOne as jest.Mock)
      .mockResolvedValueOnce(topicA)
      .mockResolvedValueOnce(topicC);
    (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

    const path = await topicService.findShortestPath('A', 'C');
    expect(path).toBeNull();
  });

  it('should find the shortest path by going up and down the tree', async () => {
    const topicA = new TopicBuilder()
      .withId('A')
      .withTopicGroupId('groupA')
      .build();
    const topicB = new TopicBuilder()
      .withId('B')
      .withTopicGroupId('groupB')
      .withParentTopicGroupId('groupA')
      .build();
    const topicC = new TopicBuilder()
      .withId('C')
      .withTopicGroupId('groupC')
      .withParentTopicGroupId('groupA')
      .build();
    const topicD = new TopicBuilder()
      .withId('D')
      .withTopicGroupId('groupD')
      .withParentTopicGroupId('groupB')
      .build();

    topicRepository.findOneBy.mockImplementation(async (criteria: any) => {
      if (criteria.id === 'D') return topicD;
      if (criteria.id === 'C') return topicC;
      return null;
    });

    (queryBuilder.getOne as jest.Mock).mockImplementation(async () => {
      const whereClause = (queryBuilder.where as jest.Mock).mock.calls.slice(
        -1,
      )[0][1];
      if (whereClause.topicGroupId === 'groupA') return topicA;
      if (whereClause.topicGroupId === 'groupB') return topicB;
      if (whereClause.topicGroupId === 'groupC') return topicC;
      if (whereClause.topicGroupId === 'groupD') return topicD;
      return null;
    });

    (queryBuilder.getMany as jest.Mock).mockImplementation(async () => {
      const whereClause = (queryBuilder.where as jest.Mock).mock.calls.slice(
        -1,
      )[0][1];
      if (whereClause.parentTopicGroupId === 'groupA') return [topicB, topicC];
      if (whereClause.parentTopicGroupId === 'groupB') return [topicD];
      return [];
    });

    const path = await topicService.findShortestPath('D', 'C');
    expect(path).not.toBeNull();
    expect(path!.map((p) => p.id)).toEqual(['D', 'B', 'A', 'C']);
  });

  it('should handle case where parent is not found in shortest path', async () => {
    const topicA = new TopicBuilder()
      .withId('A')
      .withTopicGroupId('groupA')
      .build();
    const topicC = new TopicBuilder()
      .withId('C')
      .withTopicGroupId('groupC')
      .withParentTopicGroupId('nonexistent')
      .build();

    topicRepository.findOneBy.mockImplementation(async (criteria: any) => {
      if (criteria.id === 'C') return topicC;
      if (criteria.id === 'A') return topicA;
      return null;
    });

    (queryBuilder.getOne as jest.Mock).mockImplementation(async () => {
      const whereClause = (queryBuilder.where as jest.Mock).mock.calls.slice(
        -1,
      )[0][1];
      if (whereClause.topicGroupId === 'groupC') return topicC;
      if (whereClause.topicGroupId === 'groupA') return topicA;
      if (whereClause.topicGroupId === 'nonexistent') return null;
      return null;
    });

    (queryBuilder.getMany as jest.Mock).mockResolvedValue([]);

    const path = await topicService.findShortestPath('C', 'A');
    expect(path).toBeNull();
  });

  it('should return null if start or end topic is not found', async () => {
    topicRepository.findOneBy.mockResolvedValue(null);
    const path = await topicService.findShortestPath('A', 'C');
    expect(path).toBeNull();
  });

  it('should return null when getting latest version of non-existent topic group', async () => {
    queryBuilder.getOne.mockResolvedValue(null);
    const result = await (topicService as any).getLatestVersionOfTopicByGroupId(
      'non-existent-group',
    );
    expect(result).toBeNull();
  });

  it('should return null when getting latest version of non-existent topic', async () => {
    topicRepository.findOneBy.mockResolvedValue(null);
    const result = await (topicService as any).getLatestVersionOfTopic(
      'non-existent-topic',
    );
    expect(result).toBeNull();
  });

  it('should return null when getting latest version of topic with no versions', async () => {
    const topic = new TopicBuilder()
      .withId('1')
      .withTopicGroupId('group1')
      .build();
    topicRepository.findOneBy.mockResolvedValue(topic);
    queryBuilder.getOne.mockResolvedValue(null);
    const result = await (topicService as any).getLatestVersionOfTopic('1');
    expect(result).toBeNull();
  });
});

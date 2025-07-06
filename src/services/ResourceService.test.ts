import { ResourceService } from './ResourceService';
import { Resource, ResourceType } from '../models/Resource';
import { AppDataSource } from '../db';
import { Repository } from 'typeorm';
import { ResourceBuilder } from '../models/ResourceBuilder';
import { TopicService } from './TopicService';
import { Topic } from '../models/Topic';

jest.mock('../db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

jest.mock('./TopicService');

describe('ResourceService', () => {
  let resourceService: ResourceService;
  let resourceRepository: jest.Mocked<Repository<Resource>>;
  let topicService: jest.Mocked<TopicService>;

  beforeEach(() => {
    resourceRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
    } as unknown as jest.Mocked<Repository<Resource>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(
      resourceRepository,
    );

    topicService = new TopicService() as jest.Mocked<TopicService>;
    topicService.getTopicById = jest.fn();

    resourceService = new ResourceService();
    (resourceService as any).topicService = topicService;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new resource', async () => {
    const topic = new Topic();
    topic.id = 'topic1';
    topicService.getTopicById.mockResolvedValue(topic);

    const resource = new ResourceBuilder()
      .withTopicId('topic1')
      .withUrl('http://example.com')
      .withDescription('An example resource')
      .withType(ResourceType.ARTICLE)
      .build();

    resourceRepository.create.mockReturnValue(resource);
    resourceRepository.save.mockResolvedValue(resource);

    const result = await resourceService.createResource(
      'topic1',
      'http://example.com',
      'An example resource',
      ResourceType.ARTICLE,
    );

    expect(result).toEqual(resource);
    expect(topicService.getTopicById).toHaveBeenCalledWith('topic1');
    expect(resourceRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ topicId: 'topic1' }),
    );
    expect(resourceRepository.save).toHaveBeenCalledWith(resource);
  });

  it('should return all resources for a topic', async () => {
    const resources = [
      new ResourceBuilder().withTopicId('topic1').build(),
      new ResourceBuilder().withTopicId('topic1').build(),
    ];
    resourceRepository.find.mockResolvedValue(resources);

    const result = await resourceService.getResourcesByTopic('topic1');

    expect(result).toEqual(resources);
    expect(resourceRepository.find).toHaveBeenCalledWith({
      where: { topicId: 'topic1' },
    });
  });

  it('should return an empty array if no resources are found for a topic', async () => {
    resourceRepository.find.mockResolvedValue([]);

    const result = await resourceService.getResourcesByTopic('topic1');

    expect(result).toEqual([]);
    expect(resourceRepository.find).toHaveBeenCalledWith({
      where: { topicId: 'topic1' },
    });
  });

  it('should throw an error if topicId does not exist when creating a resource', async () => {
    topicService.getTopicById.mockResolvedValue(null);

    await expect(resourceService.createResource(
      'nonExistentTopic',
      'http://example.com',
      'An example resource',
      ResourceType.ARTICLE,
    )).rejects.toThrow('Topic with ID nonExistentTopic not found.');

    expect(topicService.getTopicById).toHaveBeenCalledWith('nonExistentTopic');
    expect(resourceRepository.create).not.toHaveBeenCalled();
    expect(resourceRepository.save).not.toHaveBeenCalled();
  });
});

import { Resource, ResourceType } from '../models/Resource';
import { AppDataSource } from '../db';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { TopicService } from './TopicService';

export class ResourceService {
  private resourceRepository: Repository<Resource>;
  private topicService: TopicService;

  constructor() {
    this.resourceRepository = AppDataSource.getRepository(Resource);
    this.topicService = new TopicService();
  }

  async createResource(
    topicId: string,
    url: string,
    description: string,
    type: ResourceType,
  ): Promise<Resource> {
    const topicExists = await this.topicService.getTopicById(topicId);
    if (!topicExists) {
      throw new Error(`Topic with ID ${topicId} not found.`);
    }

    const newResource = this.resourceRepository.create({
      id: uuidv4(),
      topicId,
      url,
      description,
      type,
    });
    await this.resourceRepository.save(newResource);
    return newResource;
  }

  async getResourcesByTopic(topicId: string): Promise<Resource[]> {
    return this.resourceRepository.find({ where: { topicId } });
  }
}

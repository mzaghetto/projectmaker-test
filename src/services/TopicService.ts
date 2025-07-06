import { Topic } from '../models/Topic';
import { AppDataSource } from '../db';
import { Repository } from 'typeorm';
import { TopicFactory } from '../models/TopicFactory';
import { TopicComposite } from '../models/TopicComposite';

export class TopicService {
  private topicRepository: Repository<Topic>;

  constructor() {
    this.topicRepository = AppDataSource.getRepository(Topic);
  }

  async createTopic(
    name: string,
    content: string,
    parentTopicId?: string,
  ): Promise<Topic> {
    let parentTopicGroupId: string | undefined;
    if (parentTopicId) {
      const parentTopic = await this.getLatestVersionOfTopic(parentTopicId);
      if (parentTopic) {
        parentTopicGroupId = parentTopic.topicGroupId;
      }
    }
    const newTopic = TopicFactory.createTopic(
      name,
      content,
      parentTopicGroupId,
    );
    await this.topicRepository.save(newTopic);
    return newTopic;
  }

  async getTopics(): Promise<Topic[]> {
    return this.topicRepository.find();
  }

  async getTopicById(id: string): Promise<Topic | null> {
    return this.topicRepository.findOneBy({ id });
  }

  async updateTopic(
    id: string,
    name: string,
    content: string,
  ): Promise<Topic | undefined> {
    const topic = await this.getTopicById(id);
    if (topic) {
      const newVersion = TopicFactory.createNewVersion(topic, name, content);
      await this.topicRepository.save(newVersion);
      return newVersion;
    }
    return undefined;
  }

  async getTopicVersions(id: string): Promise<Topic[]> {
    const topic = await this.getTopicById(id);
    if (!topic) {
      return [];
    }
    // Retrieve all versions using the topicGroupId
    return this.topicRepository.find({
      where: { topicGroupId: topic.topicGroupId },
      order: { version: 'DESC' },
    });
  }

  async getTopicTree(id: string): Promise<TopicComposite | undefined> {
    const topic = await this.getTopicById(id);
    if (!topic) {
      return undefined;
    }

    // Get the LATEST version of this logical topic to ensure the tree starts from the most current version
    const latestTopicVersion = await this.getLatestVersionOfTopicByGroupId(
      topic.topicGroupId,
    );

    if (!latestTopicVersion) {
      return undefined; // Should not happen if topic was found, but for safety
    }

    const topicComposite = new TopicComposite(latestTopicVersion);

    const buildTree = async (parent: TopicComposite) => {
      // Fetch all topics that have the current parent's topicGroupId as their parentTopicGroupId
      const allChildren = await this.topicRepository.find({
        where: { parentTopicGroupId: parent.topicGroupId },
        order: { version: 'DESC' }, // Order by version descending to easily pick the latest
      });

      // Group children by topicGroupId and pick the latest version for each group
      const latestChildrenMap = new Map<string, Topic>();
      for (const child of allChildren) {
        if (!latestChildrenMap.has(child.topicGroupId)) {
          latestChildrenMap.set(child.topicGroupId, child);
        }
      }

      const children = Array.from(latestChildrenMap.values());

      for (const child of children) {
        const childComposite = new TopicComposite(child);
        parent.add(childComposite);
        await buildTree(childComposite);
      }
    };

    await buildTree(topicComposite);
    return topicComposite;
  }

  async findShortestPath(
    startTopicId: string,
    endTopicId: string,
  ): Promise<Topic[] | null> {
    const startTopic = await this.getLatestVersionOfTopic(startTopicId);
    const endTopic = await this.getLatestVersionOfTopic(endTopicId);

    if (!startTopic || !endTopic) {
      return null;
    }

    const queue: { topic: Topic; path: Topic[] }[] = [
      { topic: startTopic, path: [startTopic] },
    ];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { topic, path } = queue.shift()!;

      if (topic.topicGroupId === endTopic.topicGroupId) {
        return path;
      }

      if (!visited.has(topic.topicGroupId)) {
        visited.add(topic.topicGroupId);

        if (topic.parentTopicGroupId) {
          const parent = await this.getLatestVersionOfTopicByGroupId(
            topic.parentTopicGroupId,
          );
          if (parent) {
            queue.push({ topic: parent, path: [...path, parent] });
          }
        }

        const children = await this.topicRepository
          .createQueryBuilder('topic')
          .distinctOn(['topic.topicGroupId'])
          .where('topic.parentTopicGroupId = :parentTopicGroupId', {
            parentTopicGroupId: topic.topicGroupId,
          })
          .orderBy('topic.topicGroupId', 'ASC')
          .addOrderBy('topic.version', 'DESC')
          .getMany();

        for (const child of children) {
          if (!visited.has(child.topicGroupId)) {
            queue.push({ topic: child, path: [...path, child] });
          }
        }
      }
    }

    return null;
  }

  private async getLatestVersionOfTopic(
    topicId: string,
  ): Promise<Topic | null> {
    const topic = await this.topicRepository.findOneBy({ id: topicId });
    if (!topic) {
      return null;
    }
    return this.getLatestVersionOfTopicByGroupId(topic.topicGroupId);
  }

  private async getLatestVersionOfTopicByGroupId(
    topicGroupId: string,
  ): Promise<Topic | null> {
    return this.topicRepository
      .createQueryBuilder('topic')
      .where('topic.topicGroupId = :topicGroupId', { topicGroupId })
      .orderBy('topic.version', 'DESC')
      .limit(1)
      .getOne();
  }
}

import { Topic } from './Topic';
import { v4 as uuidv4 } from 'uuid';

export class TopicFactory {
  static createTopic(
    name: string,
    content: string,
    parentTopicGroupId?: string,
  ): Topic {
    return {
      id: uuidv4(),
      name,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1,
      topicGroupId: uuidv4(),
      parentTopicGroupId,
    };
  }

  static createNewVersion(topic: Topic, name: string, content: string): Topic {
    return {
      ...topic,
      id: uuidv4(),
      name,
      content,
      updatedAt: new Date(),
      version: topic.version + 1,
      topicGroupId: topic.topicGroupId,
    };
  }
}

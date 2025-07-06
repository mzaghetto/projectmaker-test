import { Topic } from './Topic';

export class TopicBuilder {
  private topic: Topic;

  constructor() {
    this.topic = new Topic();
  }

  withId(id: string): TopicBuilder {
    this.topic.id = id;
    return this;
  }

  withName(name: string): TopicBuilder {
    this.topic.name = name;
    return this;
  }

  withContent(content: string): TopicBuilder {
    this.topic.content = content;
    return this;
  }

  withVersion(version: number): TopicBuilder {
    this.topic.version = version;
    return this;
  }

  withTopicGroupId(topicGroupId: string): TopicBuilder {
    this.topic.topicGroupId = topicGroupId;
    return this;
  }

  withParentTopicGroupId(parentTopicGroupId: string): TopicBuilder {
    this.topic.parentTopicGroupId = parentTopicGroupId;
    return this;
  }

  fromTopic(topic: Topic): TopicBuilder {
    this.topic = { ...topic };
    return this;
  }

  build(): Topic {
    return this.topic;
  }
}

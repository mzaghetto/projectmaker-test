import { Resource, ResourceType } from './Resource';

export class ResourceBuilder {
  private resource: Resource;

  constructor() {
    this.resource = new Resource();
  }

  withId(id: string): ResourceBuilder {
    this.resource.id = id;
    return this;
  }

  withTopicId(topicId: string): ResourceBuilder {
    this.resource.topicId = topicId;
    return this;
  }

  withUrl(url: string): ResourceBuilder {
    this.resource.url = url;
    return this;
  }

  withDescription(description: string): ResourceBuilder {
    this.resource.description = description;
    return this;
  }

  withType(type: ResourceType): ResourceBuilder {
    this.resource.type = type;
    return this;
  }

  build(): Resource {
    return this.resource;
  }
}

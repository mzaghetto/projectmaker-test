import { Topic } from './Topic';

/**
 * @swagger
 * components:
 *   schemas:
 *     TopicComposite:
 *       type: object
 *       allOf:
 *         - $ref: '#/components/schemas/Topic'
 *         - type: object
 *           properties:
 *             children:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TopicComposite'
 *               description: An array of child topics, forming a hierarchical structure.
 *       example:
 *         id: d5fcd5e0-4b8f-4b8f-8b8f-4b8f4b8f4b8f
 *         name: Introduction to AI
 *         content: This topic covers the basics of Artificial Intelligence.
 *         createdAt: 2023-01-01T12:00:00Z
 *         updatedAt: 2023-01-01T12:00:00Z
 *         version: 1
 *         parentTopicGroupId: null
 *         children:
 *           - id: a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d
 *             name: Machine Learning
 *             content: Subtopic on Machine Learning.
 *             createdAt: 2023-01-01T13:00:00Z
 *             updatedAt: 2023-01-01T13:00:00Z
 *             version: 1
 *             parentTopicGroupId: d5fcd5e0-4b8f-4b8f-8b8f-4b8f4b8f4b8f
 *             children: []
 */
export class TopicComposite implements Topic {
  id: string;
  name: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  version: number;
  topicGroupId: string;
  parentTopicGroupId?: string;
  children: TopicComposite[];

  constructor(topic: Topic) {
    this.id = topic.id;
    this.name = topic.name;
    this.content = topic.content;
    this.createdAt = topic.createdAt;
    this.updatedAt = topic.updatedAt;
    this.version = topic.version;
    this.topicGroupId = topic.topicGroupId;
    this.parentTopicGroupId = topic.parentTopicGroupId;
    this.children = [];
  }

  add(topic: TopicComposite) {
    this.children.push(topic);
  }
}
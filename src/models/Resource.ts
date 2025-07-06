import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

/**
 * @swagger
 * components:
 *   schemas:
 *     ResourceType:
 *       type: string
 *       enum: [video, article, pdf]
 *       description: The type of the resource
 *
 *     Resource:
 *       type: object
 *       required:
 *         - id
 *         - topicId
 *         - url
 *         - description
 *         - type
 *         - createdAt
 *         - updatedAt
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the resource
 *         topicId:
 *           type: string
 *           description: The ID of the topic this resource belongs to
 *         url:
 *           type: string
 *           format: url
 *           description: The URL of the resource
 *         description:
 *           type: string
 *           description: A brief description of the resource
 *         type:
 *           $ref: '#/components/schemas/ResourceType'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the resource was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the resource was last updated
 *       example:
 *         id: 1a2b3c4d-5e6f-7a8b-9c0d-1e2f3a4b5c6d
 *         topicId: d5fcd5e0-4b8f-4b8f-8b8f-4b8f4b8f4b8f
 *         url: https://example.com/my-article
 *         description: An article about AI
 *         type: article
 *         createdAt: 2023-01-01T12:00:00Z
 *         updatedAt: 2023-01-01T12:00:00Z
 */
export enum ResourceType {
  VIDEO = 'video',
  ARTICLE = 'article',
  PDF = 'pdf',
}

@Entity()
export class Resource {
  @PrimaryColumn()
  id!: string;

  @Column()
  topicId!: string;

  @Column()
  url!: string;

  @Column()
  description!: string;

  @Column({
    type: 'text',
    enum: ResourceType,
  })
  type!: ResourceType;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
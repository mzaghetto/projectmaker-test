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
 *     Topic:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - content
 *         - createdAt
 *         - - updatedAt
 *         - version
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the topic
 *         name:
 *           type: string
 *           description: The name of the topic
 *         content:
 *           type: string
 *           description: The content of the topic
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the topic was created
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the topic was last updated
 *         version:
 *           type: number
 *           description: The version of the topic
 *         parentTopicGroupId:
 *           type: string
 *           description: The ID of the parent topic group (if any)
 *       example:
 *         id: d5fcd5e0-4b8f-4b8f-8b8f-4b8f4b8f4b8f
 *         name: Introduction to AI
 *         content: This topic covers the basics of Artificial Intelligence.
 *         createdAt: 2023-01-01T12:00:00Z
 *         updatedAt: 2023-01-01T12:00:00Z
 *         version: 1
 *         parentTopicId: null
 */
@Entity()
export class Topic {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column()
  content!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column()
  version!: number;

  @Column()
  topicGroupId!: string;

  @Column({ nullable: true })
  parentTopicGroupId?: string;
}
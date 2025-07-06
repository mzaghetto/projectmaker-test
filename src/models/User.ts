import { Entity, PrimaryColumn, Column, CreateDateColumn } from 'typeorm';

/**
 * @swagger
 * components:
 *   schemas:
 *     UserRole:
 *       type: string
 *       enum: [Admin, Editor, Viewer]
 *       description: The role of the user
 *
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *         - role
 *         - createdAt
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID of the user
 *         name:
 *           type: string
 *           description: The name of the user
 *         email:
 *           type: string
 *           format: email
 *           description: The email of the user
 *         role:
 *           $ref: '#/components/schemas/UserRole'
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the user was created
 *       example:
 *         id: 123e4567-e89b-12d3-a456-426614174000
 *         name: Jane Doe
 *         email: jane.doe@example.com
 *         role: Editor
 *         createdAt: 2023-01-01T12:00:00Z
 */
export enum UserRole {
  ADMIN = 'Admin',
  EDITOR = 'Editor',
  VIEWER = 'Viewer',
}

@Entity()
export class User {
  @PrimaryColumn()
  id!: string;

  @Column()
  name!: string;

  @Column({ unique: true })
  email!: string;

  @Column({
    type: 'text',
    enum: UserRole,
  })
  role!: UserRole;

  @CreateDateColumn()
  createdAt!: Date;
}
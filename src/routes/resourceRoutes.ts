import { Router } from 'express';
import { ResourceController } from '../controllers/ResourceController';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkPermission } from '../middleware/permissionMiddleware';
import { validateResource } from '../middleware/validationMiddleware';
import { UserRole } from '../models/User';

const router = Router();
const resourceController = new ResourceController();

/**
 * @swagger
 * tags:
 *   name: Resources
 *   description: Resource management and retrieval
 */

/**
 * @swagger
 * components:
 *   schemas:
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
 *           type: string
 *           enum: [video, article, pdf]
 *           description: The type of the resource
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

/**
 * @swagger
 * /resources:
 *   post:
 *     summary: Create a new resource (Editor/Admin only)
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - topicId
 *               - url
 *               - description
 *               - type
 *             properties:
 *               topicId:
 *                 type: string
 *                 example: d5fcd5e0-4b8f-4b8f-8b8f-4b8f4b8f4b8f
 *               url:
 *                 type: string
 *                 format: url
 *                 example: https://example.com/new-resource
 *               description:
 *                 type: string
 *                 example: A new resource about something.
 *               type:
 *                 type: string
 *                 enum: [video, article, pdf]
 *                 example: video
 *     responses:
 *       201:
 *         description: Resource created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Resource'
 *       400:
 *         description: Missing required fields or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/resources',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR]),
  validateResource,
  resourceController.createResource,
);

/**
 * @swagger
 * /topics/{topicId}/resources:
 *   get:
 *     summary: Get resources associated with a topic (Viewer/Editor/Admin)
 *     tags: [Resources]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: topicId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the topic to retrieve resources for
 *     responses:
 *       200:
 *         description: A list of resources for the specified topic
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Resource'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topic not found (though the endpoint returns empty array if topic has no resources)
 */
router.get(
  '/topics/:topicId/resources',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  resourceController.getResourcesByTopic,
);

export default router;
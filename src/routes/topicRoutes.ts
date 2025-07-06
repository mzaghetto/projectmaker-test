import { Router } from 'express';
import { TopicController } from '../controllers/TopicController';
import { authMiddleware } from '../middleware/authMiddleware';
import { checkPermission } from '../middleware/permissionMiddleware';
import { validateTopic } from '../middleware/validationMiddleware';
import { UserRole } from '../models/User';

const router = Router();
const topicController = new TopicController();

/**
 * @swagger
 * tags:
 *   name: Topics
 *   description: Topic management and retrieval
 */

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
 *         - updatedAt
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

/**
 * @swagger
 * /topics:
 *   post:
 *     summary: Create a new topic (Editor/Admin only)
 *     tags: [Topics]
 *     security:
 *       - ApiKeyAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 example: New Topic
 *               content:
 *                 type: string
 *                 example: Content of the new topic.
 *               parentTopicId:
 *                 type: string
 *                 example: d5fcd5e0-4b8f-4b8f-8b8f-4b8f4b8f4b8f
 *     responses:
 *       201:
 *         description: Topic created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Missing required fields or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.post(
  '/topics',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR]),
  validateTopic,
  topicController.createTopic,
);

/**
 * @swagger
 * /topics:
 *   get:
 *     summary: Get all topics (Viewer/Editor/Admin)
 *     tags: [Topics]
 *     security:
 *       - ApiKeyAuth: []
 *     responses:
 *       200:
 *         description: A list of topics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
  '/topics',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.getTopics,
);

/**
 * @swagger
 * /topics/path:
 *   get:
 *     summary: Find the shortest path between two topics (Viewer/Editor/Admin)
 *     tags: [Topics]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: startTopicId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the starting topic
 *       - in: query
 *         name: endTopicId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the ending topic
 *     responses:
 *       200:
 *         description: The shortest path as an array of topics
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Missing required query parameters
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Path not found
 */
router.get(
  '/topics/path',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.findShortestPath,
);

/**
 * @swagger
 * /topics/{id}:
 *   get:
 *     summary: Get a topic by ID (Viewer/Editor/Admin)
 *     tags: [Topics]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The topic ID
 *     responses:
 *       200:
 *         description: Topic data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topic not found
 */
router.get(
  '/topics/:id',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.getTopicById,
);

/**
 * @swagger
 * /topics/{id}:
 *   put:
 *     summary: Update a topic (Editor/Admin only)
 *     tags: [Topics]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The topic ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - content
 *             properties:
 *               name:
 *                 type: string
 *                 example: Updated Topic Name
 *               content:
 *                 type: string
 *                 example: Updated content of the topic.
 *     responses:
 *       200:
 *         description: Topic updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Topic'
 *       400:
 *         description: Missing required fields or invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topic not found
 */
router.put(
  '/topics/:id',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR]),
  validateTopic,
  topicController.updateTopic,
);

/**
 * @swagger
 * /topics/{id}/versions:
 *   get:
 *     summary: Get all versions of a topic (Viewer/Editor/Admin)
 *     tags: [Topics]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The topic ID
 *     responses:
 *       200:
 *         description: A list of topic versions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Topic'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topic not found
 */
router.get(
  '/topics/:id/versions',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.getTopicVersions,
);

/**
 * @swagger
 * /topics/{id}/tree:
 *   get:
 *     summary: Get a topic and its subtopics in a tree structure (Viewer/Editor/Admin)
 *     tags: [Topics]
 *     security:
 *       - ApiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The topic ID
 *     responses:
 *       200:
 *         description: Topic tree data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TopicComposite'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Topic not found
 */
router.get(
  '/topics/:id/tree',
  authMiddleware,
  checkPermission([UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER]),
  topicController.getTopicTree,
);

export default router;

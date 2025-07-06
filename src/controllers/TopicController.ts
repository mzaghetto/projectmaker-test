import { Request, Response } from 'express';
import { TopicService } from '../services/TopicService';
import logger from '../utils/logger';

const topicService = new TopicService();

export class TopicController {
  async createTopic(req: Request, res: Response): Promise<void> {
    try {
      const { name, content, parentTopicId } = req.body;
      if (!name || !content) {
        res.status(400).send({ error: 'Missing required fields' });
        return;
      }
      const newTopic = await topicService.createTopic(
        name,
        content,
        parentTopicId,
      );
      res.status(201).send(newTopic);
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async getTopics(req: Request, res: Response): Promise<void> {
    try {
      const topics = await topicService.getTopics();
      res.send(topics);
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async getTopicById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const topic = await topicService.getTopicById(id);
      if (topic) {
        res.send(topic);
      } else {
        res.status(404).send({ error: 'Topic not found' });
      }
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async updateTopic(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { name, content } = req.body;
      if (!name || !content) {
        res.status(400).send({ error: 'Missing required fields' });
        return;
      }
      const updatedTopic = await topicService.updateTopic(id, name, content);
      if (updatedTopic) {
        res.send(updatedTopic);
      } else {
        res.status(404).send({ error: 'Topic not found' });
      }
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async getTopicVersions(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const versions = await topicService.getTopicVersions(id);
      res.send(versions);
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async getTopicTree(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const tree = await topicService.getTopicTree(id);
      if (tree) {
        res.send(tree);
      } else {
        res.status(404).send({ error: 'Topic not found' });
      }
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async findShortestPath(req: Request, res: Response): Promise<void> {
    try {
      const { startTopicId, endTopicId } = req.query;
      if (!startTopicId || !endTopicId) {
        res.status(400).send({ error: 'Missing required query parameters' });
        return;
      }
      const path = await topicService.findShortestPath(
        startTopicId as string,
        endTopicId as string,
      );
      if (path) {
        res.send(path);
      } else {
        res.status(404).send({ error: 'Path not found' });
      }
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

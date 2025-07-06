import { Request, Response } from 'express';
import { ResourceService } from '../services/ResourceService';
import { ResourceType } from '../models/Resource';
import logger from '../utils/logger';

const resourceService = new ResourceService();

export class ResourceController {
  async createResource(req: Request, res: Response): Promise<void> {
    try {
      const { topicId, url, description, type } = req.body;
      if (!topicId || !url || !description || !type) {
        res.status(400).send({ error: 'Missing required fields' });
        return;
      }
      const newResource = await resourceService.createResource(
        topicId,
        url,
        description,
        type as ResourceType,
      );
      res.status(201).send(newResource);
    } catch (error: any) {
      if (error.message.includes('Topic with ID') && error.message.includes('not found')) {
        res.status(404).send({ error: error.message });
      } else {
        logger.error(`Error: ${error.message}`, {
          stack: error.stack,
          context: req.path,
        });
        res.status(500).send({ error: 'Internal Server Error' });
      }
    }
  }

  async getResourcesByTopic(req: Request, res: Response): Promise<void> {
    try {
      const { topicId } = req.params;
      const resources = await resourceService.getResourcesByTopic(topicId);
      res.send(resources);
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }
}

import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { UserRole } from '../models/User';
import logger from '../utils/logger';

const userService = new UserService();

export class UserController {
  async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, role } = req.body;
      if (!name || !email || !role) {
        res.status(400).send({ error: 'Missing required fields' });
        return;
      }

      const existingUser = await userService.getUserByEmail(email);
      if (existingUser) {
        res.status(409).send({ error: 'Email already in use' });
        return;
      }

      const newUser = await userService.createUser(
        name,
        email,
        role as UserRole,
      );
      res.status(201).send(newUser);
    } catch (error: any) {
      if (error.message === 'Email already in use') {
        res.status(409).send({ error: error.message });
        return;
      }
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await userService.getUsers();
      res.send(users);
    } catch (error: any) {
      logger.error(`Error: ${error.message}`, {
        stack: error.stack,
        context: req.path,
      });
      res.status(500).send({ error: 'Internal Server Error' });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getUserById(id);
      if (user) {
        res.send(user);
      } else {
        res.status(404).send({ error: 'User not found' });
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

import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AppDataSource } from '../db';
import { User } from '../models/User';
import { UserService } from '../services/UserService';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const userService = new UserService();

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'] as string;

    if (!userId) {
      res.status(401).send({ error: 'Unauthorized: Missing user ID.' });
      return;
    }

    const user = await userService.getUserById(userId);

    if (!user) {
      res.status(401).send({ error: 'Unauthorized: User not found.' });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).send({ error: 'Internal Server Error' });
  }
};

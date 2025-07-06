import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User';

export interface PermissionStrategy {
  isAllowed(user: User): boolean;
}

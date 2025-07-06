import { Request, Response, NextFunction } from 'express';
import { validationResult, check } from 'express-validator';

export const validateUser = [
  check('name').notEmpty().withMessage('Name is required'),
  check('email').isEmail().withMessage('Invalid email'),
  check('role').isIn(['Admin', 'Editor', 'Viewer']).withMessage('Invalid role'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    next();
  },
];

export const validateTopic = [
  check('name').notEmpty().withMessage('Name is required'),
  check('content').notEmpty().withMessage('Content is required'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    next();
  },
];

export const validateResource = [
  check('topicId').notEmpty().withMessage('Topic ID is required'),
  check('url').isURL().withMessage('Invalid URL'),
  check('description').notEmpty().withMessage('Description is required'),
  check('type')
    .isIn(['video', 'article', 'pdf'])
    .withMessage('Invalid resource type'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    next();
  },
];

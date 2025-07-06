import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const errorHandlerMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  logger.error(`Unhandled Error: ${err.message}`, {
    stack: err.stack,
    context: req.path,
  });

  const statusCode = err.statusCode || 500;
  let clientMessage = 'Internal Server Error';

  if (
    err.code === 'ECONNREFUSED' ||
    (typeof err.message === 'string' &&
      (err.message.includes('connect ECONNREFUSED') ||
        (err.message.includes('database') &&
          err.message.includes('connection'))))
  ) {
    clientMessage = 'Database connection error. Please try again later.';
  } else if (process.env.NODE_ENV !== 'production') {
    clientMessage = err.message;
  } else {
    clientMessage = 'Internal Server Error';
  }

  res.status(statusCode).json({
    error: {
      message: clientMessage,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
    },
  });
};

export default errorHandlerMiddleware;

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const requestLoggerMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const startHrTime = process.hrtime();
  let responseBody: any = null;

  // Log request details
  logger.info(`Incoming Request: ${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    headers: req.headers,
    body: req.body,
    query: req.query,
    params: req.params,
  });

  // Intercept res.send to capture the response body
  const originalSend = res.send;
  res.send = function (body?: any): Response {
    responseBody = body;
    return originalSend.apply(this, [body]);
  };

  // Log response details when the response finishes
  res.on('finish', () => {
    const elapsedHrTime = process.hrtime(startHrTime);
    const elapsedTimeInMs = (
      elapsedHrTime[0] * 1000 +
      elapsedHrTime[1] / 1e6
    ).toFixed(2);

    logger.info(
      `Outgoing Response: ${req.method} ${req.originalUrl} - Status: ${res.statusCode} - ${elapsedTimeInMs}ms`,
      {
        responseHeaders: res.getHeaders(),
        responseBody: responseBody,
      },
    );
  });

  next();
};

export default requestLoggerMiddleware;

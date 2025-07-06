import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express, Request, Response } from 'express';
import requestLoggerMiddleware from './middleware/requestLoggerMiddleware';
import errorHandlerMiddleware from './middleware/errorHandlerMiddleware';
import swaggerUi from 'swagger-ui-express';
import specs from './swagger';
import userRoutes from './routes/userRoutes';
import topicRoutes from './routes/topicRoutes';
import resourceRoutes from './routes/resourceRoutes';
import { AppDataSource } from './db';
import logger from './utils/logger';
import { createAdminUser } from './utils/createAdminUser';

import { Server } from 'http';

export const app: Express = express();
const port = process.env.PORT || 3000;
export let server: Server;

app.use(express.json());
app.use(requestLoggerMiddleware);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use('/api', userRoutes);
app.use('/api', topicRoutes);
app.use('/api', resourceRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Express + TypeScript Server');
});

app.use(errorHandlerMiddleware);

AppDataSource.initialize()
  .then(async () => {
    logger.info('Data Source has been initialized!');

    if (process.env.DATABASE_TYPE === 'sqlite') {
      await createAdminUser(AppDataSource);
    }

    server = app.listen(port, () => {
      logger.info(`[server]: Server is running at http://localhost:${port}`);
    });
  })
  .catch((err) => {
    logger.error('Error during Data Source initialization:', {
      message: err.message,
      stack: err.stack,
    });
  });

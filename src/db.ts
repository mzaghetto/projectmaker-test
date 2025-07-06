import { DataSource } from 'typeorm';
import config from '../ormconfig';
import { User } from './models/User';
import { Topic } from './models/Topic';
import { Resource } from './models/Resource';

export const AppDataSource = new DataSource({
  ...config,
  entities: [User, Topic, Resource],
});

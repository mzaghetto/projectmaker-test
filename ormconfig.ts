import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const config: DataSourceOptions = process.env.DATABASE_TYPE === 'sqlite' ?
  {
    type: 'sqlite',
    database: ':memory:',
    synchronize: true,
    logging: false,
    entities: [__dirname + '/src/models/*.ts'],
  } :
  {
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    username: process.env.DB_USERNAME || 'user',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'knowledge_base_db',
    synchronize: !isProduction, // In production, this should be false and migrations should be used
    logging: false,
    entities: [__dirname + '/src/models/*.ts'],
    migrations: [__dirname + '/src/migration/**/*.ts'],
    subscribers: [__dirname + '/src/subscriber/**/*.ts'],
  };

export default config;
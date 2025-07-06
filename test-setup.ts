
import { AppDataSource } from './src/db';

module.exports = async () => {
  await AppDataSource.initialize();
  console.log('Global Jest setup: Data Source initialized.');
};


import { AppDataSource } from './src/db';

module.exports = async () => {
  await AppDataSource.destroy();
  console.log('Global Jest teardown: Data Source destroyed.');
};

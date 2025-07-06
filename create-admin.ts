
import { AppDataSource } from './src/db';
import { createAdminUser as createAdminUserUtil } from './src/utils/createAdminUser';

async function createAdminUser() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    console.log('Database connection initialized.');

    await createAdminUserUtil(AppDataSource);

  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('Database connection closed.');
    }
  }
}

createAdminUser();

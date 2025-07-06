import { DataSource } from 'typeorm';
import { UserService } from '../services/UserService';
import { UserRole } from '../models/User';

export async function createAdminUser(dataSource: DataSource) {
  const userService = new UserService();

  const adminName = 'Initial Admin';
  const adminEmail = 'admin@knowledgebase.com';
  const adminRole = UserRole.ADMIN;

  const existingAdmin = await userService.getUserByEmail(adminEmail);
  if (existingAdmin) {
    console.log('Admin user already exists. ID:', existingAdmin.id);
    return existingAdmin;
  }

  const newAdmin = await userService.createUser(
    adminName,
    adminEmail,
    adminRole,
  );
  console.log('Admin user created successfully. ID:', newAdmin.id);

  return newAdmin;
}

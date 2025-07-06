import { PermissionStrategy } from './PermissionStrategy';
import { User, UserRole } from '../models/User';

export class AdminPermissionStrategy implements PermissionStrategy {
  isAllowed(user: User): boolean {
    return user.role === UserRole.ADMIN;
  }
}

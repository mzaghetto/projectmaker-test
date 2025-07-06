import { Request, Response, NextFunction } from 'express';
import { User, UserRole } from '../models/User';
import { AdminPermissionStrategy } from './AdminPermissionStrategy';
import { EditorPermissionStrategy } from './EditorPermissionStrategy';
import { ViewerPermissionStrategy } from './ViewerPermissionStrategy';
import { PermissionStrategy } from './PermissionStrategy';

declare global {
  namespace Express {
    interface Request {
      user?: User;
    }
  }
}

const permissionStrategies: Record<UserRole, PermissionStrategy> = {
  [UserRole.ADMIN]: new AdminPermissionStrategy(),
  [UserRole.EDITOR]: new EditorPermissionStrategy(),
  [UserRole.VIEWER]: new ViewerPermissionStrategy(),
};

export const checkPermission = (allowedRoles: UserRole | UserRole[]) => {
  const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).send({ error: 'Unauthorized: User not authenticated.' });
      return;
    }

    if (!rolesArray.includes(req.user.role)) {
      res.status(403).send({ 
        error: 'Forbidden: Insufficient permissions. ' +
               `Required roles: ${rolesArray.join(', ')}`
      });
      return;
    }

    next();
  };
};

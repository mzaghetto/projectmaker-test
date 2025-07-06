import { User, UserRole } from './User';

export class UserBuilder {
  private user: User;

  constructor() {
    this.user = new User();
  }

  withId(id: string): UserBuilder {
    this.user.id = id;
    return this;
  }

  withName(name: string): UserBuilder {
    this.user.name = name;
    return this;
  }

  withEmail(email: string): UserBuilder {
    this.user.email = email;
    return this;
  }

  withRole(role: UserRole): UserBuilder {
    this.user.role = role;
    return this;
  }

  build(): User {
    return this.user;
  }
}

import { User, UserRole } from '../models/User';
import { AppDataSource } from '../db';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

export class UserService {
  private userRepository: Repository<User>;

  constructor() {
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createUser(name: string, email: string, role: UserRole): Promise<User> {
    const existingUser = await this.userRepository.findOneBy({ email });
    if (existingUser) {
      throw new Error('Email already in use');
    }

    const newUser = this.userRepository.create({
      id: uuidv4(),
      name,
      email,
      role,
    });
    await this.userRepository.save(newUser);
    return newUser;
  }

  async getUsers(): Promise<User[]> {
    return this.userRepository.find();
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOneBy({ id });
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOneBy({ email });
  }
}

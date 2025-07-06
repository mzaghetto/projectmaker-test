import { UserService } from './UserService';
import { User, UserRole } from '../models/User';
import { AppDataSource } from '../db';
import { Repository } from 'typeorm';
import { UserBuilder } from '../models/UserBuilder';

jest.mock('../db', () => ({
  AppDataSource: {
    getRepository: jest.fn(),
  },
}));

describe('UserService', () => {
  let userService: UserService;
  let userRepository: jest.Mocked<Repository<User>>;

  beforeEach(() => {
    userRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOneBy: jest.fn(),
    } as unknown as jest.Mocked<Repository<User>>;

    (AppDataSource.getRepository as jest.Mock).mockReturnValue(userRepository);
    userService = new UserService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create a new user', async () => {
    const user = new UserBuilder()
      .withName('John Doe')
      .withEmail('john.doe@example.com')
      .withRole(UserRole.ADMIN)
      .build();

    userRepository.create.mockReturnValue(user);
    userRepository.save.mockResolvedValue(user);

    const result = await userService.createUser(
      'John Doe',
      'john.doe@example.com',
      UserRole.ADMIN,
    );

    expect(result).toEqual(user);
    expect(userRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'John Doe' }),
    );
    expect(userRepository.save).toHaveBeenCalledWith(user);
  });

  it('should return all users', async () => {
    const users = [
      new UserBuilder().withName('John Doe').build(),
      new UserBuilder().withName('Jane Doe').build(),
    ];
    userRepository.find.mockResolvedValue(users);

    const result = await userService.getUsers();

    expect(result).toEqual(users);
    expect(userRepository.find).toHaveBeenCalled();
  });

  it('should return a user by ID', async () => {
    const user = new UserBuilder().withId('1').build();
    userRepository.findOneBy.mockResolvedValue(user);

    const result = await userService.getUserById('1');

    expect(result).toEqual(user);
    expect(userRepository.findOneBy).toHaveBeenCalledWith({ id: '1' });
  });

  it('should return null if user not found', async () => {
    userRepository.findOneBy.mockResolvedValue(null);

    const result = await userService.getUserById('non-existent-id');

    expect(result).toBeNull();
  });

  it('should return a user by email', async () => {
    const user = new UserBuilder().withEmail('test@example.com').build();
    userRepository.findOneBy.mockResolvedValue(user);

    const result = await userService.getUserByEmail('test@example.com');

    expect(result).toEqual(user);
    expect(userRepository.findOneBy).toHaveBeenCalledWith({
      email: 'test@example.com',
    });
  });
});

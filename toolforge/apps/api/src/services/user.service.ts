import { userRepository } from '../repositories/index.js';
import type { IUser } from '../models/index.js';
import type { Role, User } from '@toolforge/shared';

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export class UserService {
  async getAll(): Promise<User[]> {
    const users = await userRepository.findAll();
    return users.map(this.toPublicUser);
  }

  async getById(id: string): Promise<User | null> {
    const user = await userRepository.findById(id);
    return user ? this.toPublicUser(user) : null;
  }

  async getByEmail(email: string): Promise<User | null> {
    const user = await userRepository.findByEmail(email);
    return user ? this.toPublicUser(user) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    // Check if user already exists
    const exists = await userRepository.existsByEmail(input.email);
    if (exists) {
      throw new Error('User with this email already exists');
    }

    const user = await userRepository.create(input);
    return this.toPublicUser(user);
  }

  async update(
    id: string,
    input: { name?: string; role?: Role; isActive?: boolean }
  ): Promise<User | null> {
    const user = await userRepository.update(id, input);
    return user ? this.toPublicUser(user) : null;
  }

  async delete(id: string): Promise<boolean> {
    return userRepository.delete(id);
  }

  toPublicUser(user: IUser): User {
    return {
      _id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}

export const userService = new UserService();

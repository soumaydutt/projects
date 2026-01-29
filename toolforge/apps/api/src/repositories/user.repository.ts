import { User, type IUser } from '../models/index.js';
import type { Role } from '@toolforge/shared';

export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
  role?: Role;
}

export interface UpdateUserInput {
  name?: string;
  role?: Role;
  isActive?: boolean;
}

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findAll(filter: Partial<IUser> = {}): Promise<IUser[]> {
    return User.find(filter).sort({ createdAt: -1 });
  }

  async create(input: CreateUserInput): Promise<IUser> {
    const user = new User({
      email: input.email.toLowerCase(),
      password: input.password,
      name: input.name,
      role: input.role || 'viewer',
    });
    return user.save();
  }

  async update(id: string, input: UpdateUserInput): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { $set: input }, { new: true });
  }

  async delete(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return result !== null;
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await User.countDocuments({ email: email.toLowerCase() });
    return count > 0;
  }
}

export const userRepository = new UserRepository();

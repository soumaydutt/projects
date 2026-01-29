import mongoose from 'mongoose';
import { RefreshToken, type IRefreshToken } from '../models/index.js';

export interface CreateRefreshTokenInput {
  userId: string;
  token: string;
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
}

export class RefreshTokenRepository {
  async findByToken(token: string): Promise<IRefreshToken | null> {
    return RefreshToken.findOne({ token });
  }

  async findByUserId(userId: string): Promise<IRefreshToken[]> {
    return RefreshToken.find({ userId: new mongoose.Types.ObjectId(userId) });
  }

  async create(input: CreateRefreshTokenInput): Promise<IRefreshToken> {
    const refreshToken = new RefreshToken({
      userId: new mongoose.Types.ObjectId(input.userId),
      token: input.token,
      userAgent: input.userAgent,
      ip: input.ip,
      expiresAt: input.expiresAt,
    });
    return refreshToken.save();
  }

  async deleteByToken(token: string): Promise<boolean> {
    const result = await RefreshToken.findOneAndDelete({ token });
    return result !== null;
  }

  async deleteByUserId(userId: string): Promise<number> {
    const result = await RefreshToken.deleteMany({ userId: new mongoose.Types.ObjectId(userId) });
    return result.deletedCount;
  }

  async deleteExpired(): Promise<number> {
    const result = await RefreshToken.deleteMany({ expiresAt: { $lt: new Date() } });
    return result.deletedCount;
  }

  async rotateToken(
    oldToken: string,
    newTokenData: CreateRefreshTokenInput
  ): Promise<IRefreshToken | null> {
    // Delete the old token
    await this.deleteByToken(oldToken);
    // Create the new token
    return this.create(newTokenData);
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();

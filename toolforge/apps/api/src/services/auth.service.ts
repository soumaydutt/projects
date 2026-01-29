import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { userRepository, refreshTokenRepository } from '../repositories/index.js';
import type { JwtPayload, AuthTokens } from '@toolforge/shared';
import type { IUser } from '../models/index.js';

export class AuthService {
  private generateAccessToken(user: IUser): string {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, config.jwt.accessSecret, {
      expiresIn: config.jwt.accessExpiresIn,
    });
  }

  private generateRefreshToken(): string {
    return jwt.sign(
      { type: 'refresh', timestamp: Date.now() },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  private getRefreshTokenExpiry(): Date {
    const match = config.jwt.refreshExpiresIn.match(/^(\d+)([dhms])$/);
    if (!match) {
      return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default 7 days
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];
    const multipliers: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
    };

    return new Date(Date.now() + value * multipliers[unit]);
  }

  async login(
    email: string,
    password: string,
    userAgent?: string,
    ip?: string
  ): Promise<{ user: IUser; tokens: AuthTokens } | null> {
    const user = await userRepository.findByEmail(email);
    if (!user || !user.isActive) {
      return null;
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return null;
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken();

    // Store refresh token
    await refreshTokenRepository.create({
      userId: user._id.toString(),
      token: refreshToken,
      userAgent,
      ip,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    return {
      user,
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async logout(refreshToken: string): Promise<boolean> {
    return refreshTokenRepository.deleteByToken(refreshToken);
  }

  async logoutAll(userId: string): Promise<number> {
    return refreshTokenRepository.deleteByUserId(userId);
  }

  async refresh(
    oldRefreshToken: string,
    userAgent?: string,
    ip?: string
  ): Promise<{ user: IUser; tokens: AuthTokens } | null> {
    // Verify the old refresh token
    try {
      jwt.verify(oldRefreshToken, config.jwt.refreshSecret);
    } catch {
      return null;
    }

    // Find the token in DB
    const storedToken = await refreshTokenRepository.findByToken(oldRefreshToken);
    if (!storedToken) {
      return null;
    }

    // Check if expired
    if (storedToken.expiresAt < new Date()) {
      await refreshTokenRepository.deleteByToken(oldRefreshToken);
      return null;
    }

    // Get user
    const user = await userRepository.findById(storedToken.userId.toString());
    if (!user || !user.isActive) {
      await refreshTokenRepository.deleteByToken(oldRefreshToken);
      return null;
    }

    // Generate new tokens
    const accessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken();

    // Rotate refresh token
    await refreshTokenRepository.rotateToken(oldRefreshToken, {
      userId: user._id.toString(),
      token: newRefreshToken,
      userAgent,
      ip,
      expiresAt: this.getRefreshTokenExpiry(),
    });

    return {
      user,
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
      },
    };
  }

  verifyAccessToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    } catch {
      return null;
    }
  }

  async getUserFromToken(token: string): Promise<IUser | null> {
    const payload = this.verifyAccessToken(token);
    if (!payload) return null;
    return userRepository.findById(payload.userId);
  }
}

export const authService = new AuthService();

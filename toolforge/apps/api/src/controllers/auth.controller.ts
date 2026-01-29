import type { Request, Response, NextFunction } from 'express';
import { authService, userService } from '../services/index.js';
import { config } from '../config/index.js';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { email, password } = req.body;
      const userAgent = req.headers['user-agent'];
      const ip = req.ip || req.socket.remoteAddress;

      const result = await authService.login(email, password, userAgent, ip);

      if (!result) {
        res.status(401).json({ message: 'Invalid credentials' });
        return;
      }

      // Set refresh token in httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/api/auth',
      });

      res.json({
        user: userService.toPublicUser(result.user),
        accessToken: result.tokens.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (refreshToken) {
        await authService.logout(refreshToken);
      }

      res.clearCookie('refreshToken', {
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        path: '/api/auth',
      });

      res.json({ message: 'Logged out successfully' });
    } catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        res.status(401).json({ message: 'Refresh token required' });
        return;
      }

      const userAgent = req.headers['user-agent'];
      const ip = req.ip || req.socket.remoteAddress;

      const result = await authService.refresh(refreshToken, userAgent, ip);

      if (!result) {
        res.clearCookie('refreshToken', {
          httpOnly: config.cookie.httpOnly,
          secure: config.cookie.secure,
          sameSite: config.cookie.sameSite,
          path: '/api/auth',
        });
        res.status(401).json({ message: 'Invalid or expired refresh token' });
        return;
      }

      // Set new refresh token in httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/api/auth',
      });

      res.json({
        user: userService.toPublicUser(result.user),
        accessToken: result.tokens.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ message: 'Not authenticated' });
        return;
      }

      res.json({ user: userService.toPublicUser(req.user) });
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();

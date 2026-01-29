import type { Request, Response, NextFunction } from 'express';
import { userService } from '../services/index.js';

export class UserController {
  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const users = await userService.getAll();
      res.json({ data: users });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.getById(id);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await userService.create(req.body);
      res.status(201).json(user);
    } catch (error) {
      if ((error as Error).message.includes('already exists')) {
        res.status(409).json({ message: (error as Error).message });
        return;
      }
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const user = await userService.update(id, req.body);

      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // Prevent self-deletion
      if (req.user?._id.toString() === id) {
        res.status(400).json({ message: 'Cannot delete your own account' });
        return;
      }

      const deleted = await userService.delete(id);

      if (!deleted) {
        res.status(404).json({ message: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();

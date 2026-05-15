import { Request, Response, NextFunction } from 'express';
import { CheckEmailRequest } from '../types';

export const validateCheckEmailRequest = (req: Request, res: Response, next: NextFunction) => {
  const { email, app_password }: CheckEmailRequest = req.body;

  if (!email || typeof email !== 'string') {
    return res.status(400).json({ status: 'error', message: 'Invalid or missing email' });
  }

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ status: 'error', message: 'Invalid email format' });
  }

  if (!app_password || typeof app_password !== 'string') {
    return res.status(400).json({ status: 'error', message: 'Invalid or missing app_password' });
  }

  if (app_password.trim().length === 0) {
    return res.status(400).json({ status: 'error', message: 'App password cannot be empty' });
  }

  next();
};

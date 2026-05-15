import { Router, Request, Response, NextFunction } from 'express';
import { checkEmailService } from '../services/checkEmail.service';
import { validateCheckEmailRequest } from '../validators/checkEmail.validator';
import { logger } from '../utils/logger';

const router = Router();

// Handle async errors
const asyncHandler = (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

router.post('/check', validateCheckEmailRequest, asyncHandler(async (req: Request, res: Response) => {
  const result = await checkEmailService.checkAccount(req.body);
  
  if (result.status === 'ERROR') {
    // We still return 200 to the client, but with ERROR status in payload so frontend can manage retries
    return res.status(200).json(result);
  }
  
  return res.status(200).json(result);
}));

export default router;

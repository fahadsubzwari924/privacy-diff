import type { RequestHandler } from 'express';
import { env } from '../env.js';
import { ERROR_CODES, ERROR_MESSAGES } from '../constants/index.js';

export const authMiddleware: RequestHandler = (req, res, next) => {
  const expected = `Bearer ${env.crawlerSharedSecret}`;
  if (req.headers.authorization !== expected) {
    res.status(401).json({ code: ERROR_CODES.UNAUTHORIZED, message: ERROR_MESSAGES.INVALID_AUTH });
    return;
  }
  next();
}

import { Router, type IRouter } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { handleCrawl } from '../controllers/crawl.controller.js';

const router: IRouter = Router();

router.post('/crawl', authMiddleware, handleCrawl);

export default router;

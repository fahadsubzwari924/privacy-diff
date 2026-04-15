import 'dotenv/config';
import express from 'express';
import { env } from './env.js';
import { logger } from './logger.js';
import { loadTrackerMap } from './tracker-map-loader.js';
import crawlRouter from './routes/crawl.route.js';
import { APP_LOCALS_KEYS } from './constants/index.js';

const app = express();
app.use(express.json());

const trackerMap = loadTrackerMap();
app.locals[APP_LOCALS_KEYS.TRACKER_MAP] = trackerMap;

app.use(crawlRouter);

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.listen(env.port, () => {
  logger.info({ port: env.port }, 'Crawler service started');
});

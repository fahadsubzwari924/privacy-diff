import { z } from "zod";
import "dotenv/config";
import {
  ENV_VALIDATION_MESSAGES,
  NODE_ENV_VALUES,
} from "./constants/index.js";

const schema = z.object({
  PORT: z.coerce.number().int().positive(),
  CRAWLER_SHARED_SECRET: z.string().min(1, ENV_VALIDATION_MESSAGES.CRAWLER_SHARED_SECRET_REQUIRED),
  WEB_CALLBACK_URL: z.string().url(ENV_VALIDATION_MESSAGES.WEB_CALLBACK_URL_INVALID),
  MAX_CONCURRENT_JOBS: z.coerce.number().int().positive(),
  NODE_ENV: z.enum(NODE_ENV_VALUES),
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌  Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = {
  port: parsed.data.PORT,
  crawlerSharedSecret: parsed.data.CRAWLER_SHARED_SECRET,
  webCallbackUrl: parsed.data.WEB_CALLBACK_URL,
  maxConcurrentJobs: parsed.data.MAX_CONCURRENT_JOBS,
  nodeEnv: parsed.data.NODE_ENV,
};

import { z } from "zod";
import {
  ENV_VALIDATION_MESSAGES,
  NODE_ENV_VALUES,
} from "./constants/index.js";

const schema = z.object({
  databaseUrl: z.string().url(ENV_VALIDATION_MESSAGES.DATABASE_URL_INVALID),
  crawlerUrl: z.string().url(ENV_VALIDATION_MESSAGES.CRAWLER_URL_INVALID),
  crawlerSharedSecret: z.string().min(1, ENV_VALIDATION_MESSAGES.CRAWLER_SHARED_SECRET_REQUIRED),
  publicBaseUrl: z.string().url(ENV_VALIDATION_MESSAGES.PUBLIC_BASE_URL_INVALID),
  nodeEnv: z.enum(NODE_ENV_VALUES),
});

const parsed = schema.safeParse({
  databaseUrl: process.env.DATABASE_URL,
  crawlerUrl: process.env.CRAWLER_URL,
  crawlerSharedSecret: process.env.CRAWLER_SHARED_SECRET,
  publicBaseUrl: process.env.PUBLIC_BASE_URL,
  nodeEnv: process.env.NODE_ENV,
});

if (!parsed.success) {
  console.error("❌  Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error("Invalid environment variables — see above for details.");
}

export const env = parsed.data;

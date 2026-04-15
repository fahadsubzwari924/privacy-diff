import pino from "pino";
import { NODE_ENV_PRODUCTION } from "./constants/index.js";

const isProduction = process.env["NODE_ENV"] === NODE_ENV_PRODUCTION;

export const logger = pino({
  level: isProduction ? "info" : "debug",
  transport: !isProduction ? { target: "pino-pretty" } : undefined,
});

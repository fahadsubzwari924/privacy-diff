import { z } from "zod";

import { ANALYZE_URL_MAX_LENGTH } from "../../constants/index";
import { isPrivateOrReservedHost } from "../private-host";

export const analyzeBodySchema = z
  .object({
    url: z
      .string()
      .max(ANALYZE_URL_MAX_LENGTH)
      .trim()
      .url({ message: "url must be a valid URL" })
      .refine(
        (s) => {
          try {
            const u = new URL(s);
            return u.protocol === "http:" || u.protocol === "https:";
          } catch {
            return false;
          }
        },
        { message: "Only http and https URLs are supported" },
      )
      .refine(
        (s) => {
          try {
            return !isPrivateOrReservedHost(new URL(s).hostname);
          } catch {
            return false;
          }
        },
        { message: "Private or local addresses are not allowed" },
      ),
  })
  .strict();

export type AnalyzeBody = z.infer<typeof analyzeBodySchema>;

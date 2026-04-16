import { z } from "zod";

// Max 220 chars: makeSlug() produces "{hostname}-{6 hex chars}".
// A hostname is capped at 253 chars by DNS spec; after replacing non-alphanumeric
// chars with hyphens and stripping leading/trailing hyphens the result is always
// shorter, so 220 provides ample headroom without admitting arbitrary long strings.
export const reportIdParamSchema = z
  .string()
  .min(3)
  .max(220)
  .regex(/^[a-z0-9-]+$/, {
    message: "report id must contain only lowercase letters, digits, and hyphens",
  });

import dns from "dns/promises";
import { SsrfError } from "../errors/index.js";
import { PRIVATE_IP_RANGES } from "../constants/index.js";

export async function ssrfGuard(rawUrl: string): Promise<void> {
  if (typeof rawUrl !== "string") {
    throw new SsrfError(`Invalid URL: ${rawUrl}`);
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new SsrfError(`Invalid URL: ${rawUrl}`);
  }

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new SsrfError(`Scheme not allowed: ${parsed.protocol}`);
  }

  let address: string;
  try {
    const result = await dns.lookup(parsed.hostname);
    address = result.address;
  } catch {
    throw new SsrfError(`DNS resolution failed for ${parsed.hostname}`);
  }

  const isPrivate = PRIVATE_IP_RANGES.some((pattern) => pattern.test(address));
  if (isPrivate) {
    throw new SsrfError(`Private IP address not allowed: ${address}`);
  }
}

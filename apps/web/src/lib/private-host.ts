const IPV4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;

function ipv4Octets(host: string): [number, number, number, number] | null {
  const m = host.match(IPV4);
  if (!m) return null;
  const parts = [m[1], m[2], m[3], m[4]].map((x) => Number(x));
  if (parts.some((n) => n > 255 || Number.isNaN(n))) return null;
  return parts as [number, number, number, number];
}

function isPrivateIpv4(o: [number, number, number, number]): boolean {
  const [a, b] = o;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

/**
 * Host-level SSRF guard for user-supplied URLs (complements crawler-side checks).
 */
export function isPrivateOrReservedHost(hostname: string): boolean {
  const raw = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (raw === "localhost" || raw.endsWith(".localhost")) return true;
  if (raw.endsWith(".local")) return true;

  const v4 = ipv4Octets(raw);
  if (v4) return isPrivateIpv4(v4);

  if (raw === "::1" || raw === "0:0:0:0:0:0:0:1") return true;

  return false;
}

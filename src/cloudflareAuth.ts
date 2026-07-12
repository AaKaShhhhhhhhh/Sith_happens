import { createRemoteJWKSet, jwtVerify } from "jose";

type HeaderBag = Headers | Record<string, string | string[] | undefined | null>;

export type CloudflareAccessConfig = {
  teamDomain: string;
  audience: string;
  issuer: string;
  jwksUrl: string;
};

export type CloudflareIdentity = {
  email: string;
  name?: string;
  ip?: string;
  userId?: string;
};

function header(headers: HeaderBag, name: string) {
  if (headers instanceof Headers) return headers.get(name);
  const value = headers[name] ?? headers[name.toLowerCase()] ?? headers[name.toUpperCase()];
  return Array.isArray(value) ? value[0] : value ?? null;
}

function required(env: NodeJS.ProcessEnv | Record<string, string | undefined>, key: string) {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing ${key}`);
  return value;
}

export function buildCloudflareAccessConfig(env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env) {
  const teamDomain = required(env, "CLOUDFLARE_TEAM_DOMAIN").replace(/^https?:\/\//, "").replace(/\/$/, "");
  const audience = required(env, "CLOUDFLARE_ACCESS_AUD");
  const issuer = `https://${teamDomain}`;

  return {
    teamDomain,
    audience,
    issuer,
    jwksUrl: `${issuer}/cdn-cgi/access/certs`,
  } satisfies CloudflareAccessConfig;
}

export function getCloudflareAccessToken(headers: HeaderBag) {
  return header(headers, "CF-Access-Jwt-Assertion") ?? header(headers, "cf-access-jwt-assertion");
}

export function extractCloudflareIdentity(headers: HeaderBag): CloudflareIdentity | null {
  const email = header(headers, "CF-Access-Authenticated-User-Email");
  if (!email) return null;

  return {
    email,
    name: header(headers, "CF-Access-Authenticated-User-Name") ?? undefined,
    ip: header(headers, "CF-Connecting-IP") ?? undefined,
    userId: header(headers, "CF-Access-Authenticated-User-ID") ?? undefined,
  };
}

export function requireCloudflareIdentity(headers: HeaderBag) {
  const identity = extractCloudflareIdentity(headers);
  if (!identity) throw new Error("Cloudflare Access identity required");
  return identity;
}

export async function verifyCloudflareAccessJwt(
  token: string,
  config: CloudflareAccessConfig = buildCloudflareAccessConfig(),
): Promise<CloudflareIdentity> {
  const jwks = createRemoteJWKSet(new URL(config.jwksUrl));
  const { payload } = await jwtVerify(token, jwks, {
    issuer: config.issuer,
    audience: config.audience,
  });

  const email = typeof payload.email === "string" ? payload.email : undefined;
  if (!email) throw new Error("Cloudflare Access JWT did not include an email claim");

  return {
    email,
    name: typeof payload.name === "string" ? payload.name : undefined,
    userId: typeof payload.sub === "string" ? payload.sub : undefined,
  };
}

export async function authenticateCloudflareRequest(headers: HeaderBag) {
  const forwardedIdentity = extractCloudflareIdentity(headers);
  if (forwardedIdentity) return forwardedIdentity;

  const token = getCloudflareAccessToken(headers);
  if (!token) throw new Error("Cloudflare Access identity required");
  return verifyCloudflareAccessJwt(token);
}

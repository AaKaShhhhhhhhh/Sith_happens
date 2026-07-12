import { describe, expect, it } from "vitest";
import {
  buildCloudflareAccessConfig,
  extractCloudflareIdentity,
  getCloudflareAccessToken,
  requireCloudflareIdentity,
} from "../src/cloudflareAuth";

describe("Cloudflare auth helpers", () => {
  it("builds Cloudflare Access config from env", () => {
    expect(
      buildCloudflareAccessConfig({
        CLOUDFLARE_TEAM_DOMAIN: "midnight.cloudflareaccess.com",
        CLOUDFLARE_ACCESS_AUD: "app-aud",
      }),
    ).toEqual({
      teamDomain: "midnight.cloudflareaccess.com",
      audience: "app-aud",
      issuer: "https://midnight.cloudflareaccess.com",
      jwksUrl: "https://midnight.cloudflareaccess.com/cdn-cgi/access/certs",
    });
  });

  it("requires Cloudflare Access env fields", () => {
    expect(() => buildCloudflareAccessConfig({})).toThrow(/CLOUDFLARE_TEAM_DOMAIN/);
    expect(() => buildCloudflareAccessConfig({ CLOUDFLARE_TEAM_DOMAIN: "team.cloudflareaccess.com" })).toThrow(
      /CLOUDFLARE_ACCESS_AUD/,
    );
  });

  it("extracts the Cloudflare Access JWT from headers", () => {
    expect(getCloudflareAccessToken(new Headers({ "CF-Access-Jwt-Assertion": "jwt-123" }))).toBe("jwt-123");
    expect(getCloudflareAccessToken({ "cf-access-jwt-assertion": "jwt-456" })).toBe("jwt-456");
    expect(getCloudflareAccessToken({})).toBeNull();
  });

  it("extracts identity headers Cloudflare can forward to the app", () => {
    expect(
      extractCloudflareIdentity({
        "cf-access-authenticated-user-email": "person@example.com",
        "cf-connecting-ip": "203.0.113.1",
      }),
    ).toEqual({ email: "person@example.com", ip: "203.0.113.1" });
  });

  it("rejects requests missing a Cloudflare identity", () => {
    expect(() => requireCloudflareIdentity({})).toThrow(/Cloudflare Access identity required/);
  });
});

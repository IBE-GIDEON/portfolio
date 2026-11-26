/**
 * The admin login cookie: an expiry time signed with HMAC-SHA256, so it
 * can't be forged or extended without the server's secret.
 */
import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "gi_admin";
export const SESSION_DAYS = 7;
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60; // seconds

const sign = (expiresAt: number, secret: string) =>
  createHmac("sha256", secret).update(String(expiresAt)).digest("base64url");

/** "<expiresAt>.<signature>" */
export function signSession(expiresAt: number, secret: string): string {
  return `${expiresAt}.${sign(expiresAt, secret)}`;
}

export function verifySession(token: string | undefined, secret: string, now = Date.now()): boolean {
  if (!token) return false;
  const dot = token.indexOf(".");
  if (dot <= 0) return false;
  const time = token.slice(0, dot);
  if (!/^\d+$/.test(time)) return false;
  const expiresAt = Number(time);
  if (now >= expiresAt) return false;

  const given = Buffer.from(token.slice(dot + 1));
  const expected = Buffer.from(sign(expiresAt, secret));
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/** Compares in constant time; hashing first makes both sides the same length. */
export function passwordMatches(input: string, expected: string): boolean {
  const a = createHash("sha256").update(input).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

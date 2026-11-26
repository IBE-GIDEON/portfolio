import { expect, test } from "vitest";
import { passwordMatches, signSession, verifySession } from "./session";

const SECRET = "s".repeat(40);
const expiresAt = Date.UTC(2030, 0, 1);

test("a signed session verifies before it expires", () => {
  const token = signSession(expiresAt, SECRET);
  expect(token.startsWith(`${expiresAt}.`)).toBe(true);
  expect(verifySession(token, SECRET, expiresAt - 1)).toBe(true);
});

test("an expired session fails", () => {
  expect(verifySession(signSession(expiresAt, SECRET), SECRET, expiresAt + 1)).toBe(false);
});

test("a tampered signature fails", () => {
  const token = signSession(expiresAt, SECRET);
  const last = token.at(-1) === "A" ? "B" : "A";
  expect(verifySession(token.slice(0, -1) + last, SECRET, expiresAt - 1)).toBe(false);
});

test("a pushed-out expiry fails (the time is part of the signature)", () => {
  const [, sig] = signSession(expiresAt, SECRET).split(".");
  expect(verifySession(`${expiresAt + 1000}.${sig}`, SECRET, expiresAt - 1)).toBe(false);
});

test("the wrong secret fails", () => {
  expect(verifySession(signSession(expiresAt, SECRET), "x".repeat(40), expiresAt - 1)).toBe(false);
});

test("missing or malformed tokens fail", () => {
  expect(verifySession(undefined, SECRET, 0)).toBe(false);
  expect(verifySession("", SECRET, 0)).toBe(false);
  expect(verifySession("garbage", SECRET, 0)).toBe(false);
  expect(verifySession("abc.def", SECRET, 0)).toBe(false);
});

test("passwords compare exactly", () => {
  expect(passwordMatches("a", "a")).toBe(true);
  expect(passwordMatches("a", "b")).toBe(false);
  expect(passwordMatches("a", "aa")).toBe(false);
  expect(passwordMatches("", "a")).toBe(false);
});

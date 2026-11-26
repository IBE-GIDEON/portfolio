import { afterEach, expect, test, vi } from "vitest";
import { uploadImage } from "./api";

afterEach(() => vi.unstubAllGlobals());

test("a picture over 4 MB is refused before it's sent", async () => {
  const fetchSpy = vi.fn();
  vi.stubGlobal("fetch", fetchSpy);
  const big = new File([new Uint8Array(4 * 1024 * 1024 + 1)], "photo.jpg", { type: "image/jpeg" });
  const result = await uploadImage(big, "photo");
  expect(result).toMatchObject({ ok: false, signedOut: false });
  if (!result.ok) expect(result.message).toMatch(/4 MB/);
  expect(fetchSpy).not.toHaveBeenCalled();
});

test("the hosting's own 'too large' answer gets the same clear message", async () => {
  vi.stubGlobal("fetch", vi.fn(async () => new Response("Request Entity Too Large", { status: 413 })));
  const file = new File([new Uint8Array(10)], "photo.jpg", { type: "image/jpeg" });
  const result = await uploadImage(file, "photo");
  if (result.ok) throw new Error("expected a failure");
  expect(result.message).toMatch(/4 MB/);
});

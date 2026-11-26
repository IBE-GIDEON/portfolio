import sharp from "sharp";
import { expect, test } from "vitest";
import { ImageError, processPhoto, processScreenshot } from "./images";

const png = (width: number, height: number) =>
  sharp({ create: { width, height, channels: 3, background: "#336699" } }).png().toBuffer();

test("a screenshot becomes a 1200×750 WebP with a blur preview and a hashed name", async () => {
  const held = await processScreenshot(await png(1600, 1000), "three-ai");
  expect(held.path).toMatch(/^\/projects\/three-ai\.[0-9a-f]{6}\.webp$/);
  expect(held.projectId).toBe("three-ai");
  expect(held.blur).toMatch(/^data:image\/webp;base64,/);
  const meta = await sharp(Buffer.from(held.webpBase64, "base64")).metadata();
  expect([meta.format, meta.width, meta.height]).toEqual(["webp", 1200, 750]);
});

test("the same picture always gets the same name, a different one a new name", async () => {
  const a = await processScreenshot(await png(1600, 1000), "x");
  const b = await processScreenshot(await png(1600, 1000), "x");
  const c = await processScreenshot(
    await sharp({ create: { width: 1600, height: 1000, channels: 3, background: "#993333" } }).png().toBuffer(),
    "x",
  );
  expect(a.path).toBe(b.path);
  expect(c.path).not.toBe(a.path);
});

test("a photo becomes a 512×512 WebP at /me.<hash>.webp", async () => {
  const held = await processPhoto(await png(900, 1200));
  expect(held.path).toMatch(/^\/me\.[0-9a-f]{6}\.webp$/);
  expect(held.projectId).toBeUndefined();
  const meta = await sharp(Buffer.from(held.webpBase64, "base64")).metadata();
  expect([meta.format, meta.width, meta.height]).toEqual(["webp", 512, 512]);
});

test("something that isn't a picture is refused", async () => {
  await expect(processScreenshot(Buffer.from("hello, not an image"), "x")).rejects.toBeInstanceOf(ImageError);
  await expect(processPhoto(Buffer.from("<svg xmlns='http://www.w3.org/2000/svg'/>"))).rejects.toBeInstanceOf(ImageError);
});

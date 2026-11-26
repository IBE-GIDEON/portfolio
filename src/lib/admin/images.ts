/**
 * Prepares uploaded pictures exactly like `npm run images` does, so admin
 * uploads and the build pipeline produce the same files.
 */
import { createHash } from "node:crypto";
import sharp from "sharp";
import type { HeldImage } from "./commit";

/** The upload isn't a picture sharp can read. */
export class ImageError extends Error {
  constructor(message = "That file isn't a picture we can read. Try a JPG, PNG or WebP.") {
    super(message);
    this.name = "ImageError";
  }
}

const ACCEPTED = new Set(["jpeg", "png", "webp"]);

/** A short content hash, so a replaced picture gets a new name and never shows a cached old copy. */
const hash6 = (bytes: Buffer) => createHash("sha256").update(bytes).digest("hex").slice(0, 6);

async function open(input: Buffer) {
  try {
    const image = sharp(input, { limitInputPixels: 50_000_000 });
    const { format } = await image.metadata();
    if (!format || !ACCEPTED.has(format)) throw new ImageError();
    // Turn phone photos the right way up before resizing.
    return image.rotate();
  } catch (error) {
    if (error instanceof ImageError) throw error;
    throw new ImageError();
  }
}

/** 1200×750 WebP (the top of the page, like a browser shows it) plus a 24×15 blurred preview. */
export async function processScreenshot(input: Buffer, projectId: string): Promise<HeldImage> {
  const image = (await open(input)).resize(1200, 750, { fit: "cover", position: "top" });
  try {
    const webp = await image.clone().webp({ quality: 72, effort: 6 }).toBuffer();
    const blur = await image.clone().resize(24, 15).webp({ quality: 45 }).toBuffer();
    return {
      path: `/projects/${projectId}.${hash6(webp)}.webp`,
      webpBase64: webp.toString("base64"),
      blur: `data:image/webp;base64,${blur.toString("base64")}`,
      projectId,
    };
  } catch {
    throw new ImageError();
  }
}

/** 512×512 WebP, cropped around the face. */
export async function processPhoto(input: Buffer): Promise<HeldImage> {
  const image = (await open(input)).resize(512, 512, { fit: "cover", position: "attention" });
  try {
    const webp = await image.webp({ quality: 80 }).toBuffer();
    return { path: `/me.${hash6(webp)}.webp`, webpBase64: webp.toString("base64") };
  } catch {
    throw new ImageError();
  }
}

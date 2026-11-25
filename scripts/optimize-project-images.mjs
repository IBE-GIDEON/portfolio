/**
 * Turns the full-size homepage screenshots in assets/projects/*.jpg into
 * what the site actually serves:
 *   public/projects/<id>.webp         1200×750, small and sharp on Retina cards
 *   src/content/projectImages.json    a tiny blurred preview per image
 *
 * It also prepares your profile photo when assets/me.jpg (or .png) exists:
 *   public/me.webp                    512×512, centred on your face
 *
 * Run after adding or replacing a screenshot or photo:  npm run images
 */
import { access, readdir, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "assets/projects";
const OUT = "public/projects";
const MANIFEST = "src/content/projectImages.json";

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
const manifest = {};
let bytes = 0;

for (const file of files) {
  const id = path.parse(file).name;
  const input = sharp(path.join(SRC, file)).resize(1200, 750, { fit: "cover", position: "top" });

  const webp = await input.clone().webp({ quality: 72, effort: 6 }).toBuffer();
  await writeFile(path.join(OUT, `${id}.webp`), webp);
  bytes += webp.length;

  const blur = await input.clone().resize(24, 15).webp({ quality: 45 }).toBuffer();
  manifest[id] = { src: `/projects/${id}.webp`, blur: `data:image/webp;base64,${blur.toString("base64")}` };
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
console.log(`${files.length} screenshots → ${Math.round(bytes / 1024)} KB of WebP (${Math.round(bytes / 1024 / files.length)} KB each on average)`);

for (const ext of ["jpg", "jpeg", "png"]) {
  const photo = `assets/me.${ext}`;
  try {
    await access(photo);
  } catch {
    continue;
  }
  await sharp(photo).resize(512, 512, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile("public/me.webp");
  console.log(`profile photo → public/me.webp (set photo: "/me.webp" in src/content/site.ts)`);
  break;
}

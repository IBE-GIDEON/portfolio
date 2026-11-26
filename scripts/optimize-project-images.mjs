/**
 * Turns the full-size homepage screenshots in assets/projects/*.jpg into
 * what the site actually serves:
 *   public/projects/<id>.webp         1200×750, small and sharp on Retina cards
 *   src/content/projectImages.json    a tiny blurred preview per image
 *
 * It merges into the manifest: entries for other projects are kept, and a
 * screenshot replaced from /admin (a hashed name like three-ai.3f9a2c.webp)
 * is left alone, so this script never brings an old picture back.
 *
 * It also prepares your profile photo when assets/me.jpg (or .png) exists:
 *   public/me.webp                    512×512, centred on your face
 *
 * Run after adding or replacing a screenshot or photo:  npm run images
 * (The admin at /admin does all of this for you on upload.)
 */
import { access, readdir, readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const SRC = "assets/projects";
const OUT = "public/projects";
const MANIFEST = "src/content/projectImages.json";

await mkdir(OUT, { recursive: true });
const files = (await readdir(SRC)).filter((f) => /\.(jpe?g|png)$/i.test(f)).sort();
const manifest = JSON.parse(await readFile(MANIFEST, "utf8").catch(() => "{}"));
let bytes = 0;
let made = 0;

for (const file of files) {
  const id = path.parse(file).name;
  const src = `/projects/${id}.webp`;
  if (manifest[id] && manifest[id].src !== src) {
    console.log(`skipped ${id}: its screenshot was replaced from the admin (${manifest[id].src})`);
    continue;
  }
  const input = sharp(path.join(SRC, file)).resize(1200, 750, { fit: "cover", position: "top" });

  const webp = await input.clone().webp({ quality: 72, effort: 6 }).toBuffer();
  await writeFile(path.join(OUT, `${id}.webp`), webp);
  bytes += webp.length;
  made += 1;

  const blur = await input.clone().resize(24, 15).webp({ quality: 45 }).toBuffer();
  // Existing entries keep their place in the file; new ones go last.
  manifest[id] = { src, blur: `data:image/webp;base64,${blur.toString("base64")}` };
}

await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");
if (made) console.log(`${made} screenshots → ${Math.round(bytes / 1024)} KB of WebP (${Math.round(bytes / 1024 / made)} KB each on average)`);

for (const ext of ["jpg", "jpeg", "png"]) {
  const photo = `assets/me.${ext}`;
  try {
    await access(photo);
  } catch {
    continue;
  }
  await sharp(photo).rotate().resize(512, 512, { fit: "cover", position: "attention" }).webp({ quality: 80 }).toFile("public/me.webp");
  console.log(`profile photo → public/me.webp (set "photo": "/me.webp" in src/content/site.json, or upload it in /admin)`);
  break;
}

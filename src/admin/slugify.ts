/** "Braids at Reen's" → "braids-at-reens" (a project's id and screenshot file name). */
export function slugify(name: string): string {
  const slug = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // drop accents: é → e
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/, "");
  return slug || "project";
}

/** Adds -2, -3… until the id isn't taken. */
export function uniqueId(id: string, taken: Iterable<string>): string {
  const used = new Set(taken);
  if (!used.has(id)) return id;
  let n = 2;
  while (used.has(`${id}-${n}`)) n++;
  return `${id}-${n}`;
}

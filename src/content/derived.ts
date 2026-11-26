/** Short forms of the profile text, used where the site needs a compact name. */

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean);

/** "Gideon Ibe" → "Gideon" (the sidebar name). */
export function firstName(name: string): string {
  return words(name)[0] ?? "";
}

/** "Gideon Ibe" → "GI" (the avatar when there's no photo). */
export function initials(name: string): string {
  return words(name)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

/** "Gideon Da Critic" → "GIDEON DA CRITIC" (typed by the intro). */
export function introName(alias: string): string {
  return alias.trim().toUpperCase();
}

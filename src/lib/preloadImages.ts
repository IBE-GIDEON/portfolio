/**
 * Starts downloading images in the background and keeps them in memory, so
 * when they're shown later they appear instantly instead of loading one by one.
 */
const kept = new Map<string, HTMLImageElement>();

export function preloadImages(srcs: readonly string[]) {
  if (typeof window === "undefined") return;
  for (const src of srcs) {
    if (kept.has(src)) continue;
    const img = new window.Image();
    img.decoding = "async";
    img.src = src;
    kept.set(src, img);
  }
}

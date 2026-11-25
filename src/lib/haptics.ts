/**
 * Haptic tap. Only Android browsers expose vibration to the web; everywhere
 * else (Mac trackpads, iPhone Safari, desktops) this is a silent no-op, so
 * pair it with a sound or a small motion for the "haptic" feel.
 *
 * Browsers also refuse vibration until the visitor has tapped or clicked the
 * page, so before that we skip it instead of triggering a console warning.
 */
export function tap(ms = 8) {
  if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  navigator.vibrate(ms);
}

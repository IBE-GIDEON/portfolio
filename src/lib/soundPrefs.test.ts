import { expect, test, vi } from "vitest";
import { readSoundPref, writeSoundPref } from "@/lib/soundPrefs";

const mem = (v: string | null) => ({ getItem: () => v, setItem: vi.fn() });

test("sound defaults to on", () => {
  expect(readSoundPref(null)).toBe(true);
  expect(readSoundPref(mem(null))).toBe(true);
});

test("a saved 'off' is respected", () => {
  expect(readSoundPref(mem("off"))).toBe(false);
});

test("turning sound off is saved", () => {
  const s = mem(null);
  writeSoundPref(s, false);
  expect(s.setItem).toHaveBeenCalledWith("gideon:sound", "off");
});

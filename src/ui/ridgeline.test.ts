import { expect, test } from "vitest";
import { ridgeline } from "@/ui/ridgeline";

const box = { width: 400, height: 96 };

test("draws the requested number of lines", () => {
  expect(ridgeline("three-ai", { ...box, lines: 9 })).toHaveLength(9);
});

test("is deterministic per seed and different across seeds", () => {
  expect(ridgeline("hombox", box)).toEqual(ridgeline("hombox", box));
  expect(ridgeline("hombox", box)).not.toEqual(ridgeline("three-ai", box));
});

test("every point stays inside the box", () => {
  for (const { line } of ridgeline("ai-integrations", box)) {
    const ys = [...line.matchAll(/[ML]\s*[\d.]+\s+(-?[\d.]+)/g)].map((m) => Number(m[1]));
    expect(ys.length).toBeGreaterThan(10);
    for (const y of ys) {
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(box.height);
    }
  }
});

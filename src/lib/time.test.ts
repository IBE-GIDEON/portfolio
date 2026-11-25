import { expect, test } from "vitest";
import { formatMenuClock, localTimeIn } from "@/lib/time";

const d = new Date("2026-11-25T13:32:00Z");

test("menu clock reads like the macOS menu bar", () => {
  expect(formatMenuClock(d, { locale: "en-GB", timeZone: "Africa/Lagos" })).toBe("Wed 25 Nov 14:32");
});

test("Port Harcourt local time is 24-hour HH:mm", () => {
  expect(localTimeIn(d, "Africa/Lagos", "en-GB")).toBe("14:32");
});

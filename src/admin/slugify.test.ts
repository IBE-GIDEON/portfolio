import { expect, test } from "vitest";
import { slugify, uniqueId } from "./slugify";

test("names become lowercase dashed ids", () => {
  expect(slugify("Three AI")).toBe("three-ai");
  expect(slugify("Braids at Reen's")).toBe("braids-at-reens");
  expect(slugify("  Café — Lagos!  ")).toBe("cafe-lagos");
  expect(slugify("!!!")).toBe("project");
});

test("ids already taken get a number", () => {
  expect(uniqueId("three-ai", ["three-ai"])).toBe("three-ai-2");
  expect(uniqueId("three-ai", ["three-ai", "three-ai-2"])).toBe("three-ai-3");
  expect(uniqueId("hombox", ["three-ai"])).toBe("hombox");
});

import { expect, test } from "vitest";
import { firstName, initials, introName } from "./derived";

test("first name is the first word of the name", () => {
  expect(firstName("Gideon Ibe")).toBe("Gideon");
  expect(firstName("  Gideon  Ibe ")).toBe("Gideon");
});

test("initials take the first letters of up to two words", () => {
  expect(initials("Gideon Ibe")).toBe("GI");
  expect(initials("Cher")).toBe("C");
  expect(initials("  gideon  chinemerem ibe ")).toBe("GC");
});

test("the intro types the alias in capitals", () => {
  expect(introName("Gideon Da Critic")).toBe("GIDEON DA CRITIC");
  expect(introName("  Gideon Da Critic ")).toBe("GIDEON DA CRITIC");
});

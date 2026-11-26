import { expect, test } from "vitest";
import { validateContent } from "./schema";
import data from "./site.json";

/** A loosely typed deep copy, so tests can break the content on purpose. */
const copy = () => JSON.parse(JSON.stringify(data));

test("the real content is valid", () => {
  expect(validateContent(data).ok).toBe(true);
});

test("duplicate project ids fail", () => {
  const bad = copy();
  bad.projects[1].id = bad.projects[0].id;
  expect(validateContent(bad)).toMatchObject({
    ok: false,
    errors: [expect.objectContaining({ path: "projects" })],
  });
});

test("http links fail, empty social links pass", () => {
  const bad = copy();
  bad.projects[0].action = { label: "View", href: "http://x.com" };
  expect(validateContent(bad).ok).toBe(false);
  const empty = copy();
  empty.links[0].href = "";
  expect(validateContent(empty).ok).toBe(true);
});

test("missing name fails with its path", () => {
  const bad = copy();
  bad.name = " ";
  expect(validateContent(bad)).toMatchObject({
    ok: false,
    errors: [expect.objectContaining({ path: "name" })],
  });
});

test("nested errors report a dotted path", () => {
  const bad = copy();
  bad.projects[2].action = { label: "View", href: "not a url" };
  const result = validateContent(bad);
  expect(result.ok).toBe(false);
  if (!result.ok) expect(result.errors.map((e) => e.path)).toContain("projects.2.action.href");
});

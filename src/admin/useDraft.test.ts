import { expect, test } from "vitest";
import { publishOutcome } from "./useDraft";

test("a successful publish carries the commit link and the new sha", () => {
  expect(publishOutcome(200, { commitUrl: "u", sha: "s2" })).toMatchObject({ kind: "ok", commitUrl: "u", sha: "s2" });
});

test("publishing nothing new is still ok, with no commit", () => {
  expect(publishOutcome(200, { unchanged: true, sha: "s1" })).toMatchObject({ kind: "ok", commitUrl: null, sha: "s1" });
});

test("invalid content lists the field errors", () => {
  const errors = [{ path: "name", message: "This can't be empty" }];
  expect(publishOutcome(422, { errors })).toEqual({ kind: "invalid", errors });
});

test("each failure maps to what the screen should say", () => {
  expect(publishOutcome(409, { error: "conflict" })).toEqual({ kind: "conflict" });
  expect(publishOutcome(401, { error: "signed-out" })).toEqual({ kind: "signed-out" });
  expect(publishOutcome(502, { error: "github-auth" })).toEqual({ kind: "github-auth" });
  expect(publishOutcome(502, { error: "github", message: "GitHub answered 500" })).toEqual({
    kind: "error",
    message: "GitHub answered 500",
  });
  expect(publishOutcome(500, null)).toMatchObject({ kind: "error" });
});

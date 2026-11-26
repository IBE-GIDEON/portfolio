import { renderToStaticMarkup } from "react-dom/server";
import { expect, test, vi } from "vitest";

// The real content, with Facebook and GitHub emptied (as if cleared in the admin).
vi.mock("@/content/site", async (importOriginal) => {
  const real = await importOriginal<typeof import("@/content/site")>();
  const links = real.site.links.map((l) => (l.id === "facebook" || l.id === "github" ? { ...l, href: "" } : l));
  return { ...real, site: { ...real.site, links }, activeLinks: links.filter((l) => l.href !== "") };
});

test("a social link left empty is hidden from the sidebar", async () => {
  const { Sidebar } = await import("./Sidebar");
  const html = renderToStaticMarkup(<Sidebar section="overview" onGo={() => {}} />);
  expect(html).toContain("Instagram");
  expect(html).not.toContain("Facebook");
  expect(html).not.toContain("coming soon");
});

test("a social link left empty is hidden from the contact page", async () => {
  const { Contact } = await import("@/sections/Contact");
  const html = renderToStaticMarkup(<Contact />);
  expect(html).toContain("Instagram");
  expect(html).not.toContain("Facebook");
  expect(html).not.toContain("coming soon");
});

test("without a GitHub link the About window shows no GitHub button", async () => {
  const { About } = await import("@/sections/About");
  const html = renderToStaticMarkup(<About go={() => {}} openProject={() => {}} />);
  expect(html).not.toContain("GitHub…");
  expect(html).not.toMatch(/href=""/);
});

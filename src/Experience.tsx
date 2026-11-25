"use client";

import { Intro } from "@/components/intro/Intro";
import { AppShell } from "@/shell/AppShell";

/** The whole site: the intro, then the app underneath it. */
export function Experience() {
  return (
    <>
      <AppShell />
      <Intro />
    </>
  );
}

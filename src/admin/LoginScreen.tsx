"use client";

import { useState } from "react";
import { motion, useAnimationControls } from "motion/react";
import { site } from "@/content/site";
import { Avatar } from "@/ui/Avatar";
import { signIn } from "./api";

/**
 * A macOS-style lock screen: one password field. As a `sheet` it sits over
 * the editor (after the session expired) so unsaved edits stay put.
 */
export function LoginScreen({
  onSignedIn,
  onNotConfigured,
  sheet = false,
}: {
  onSignedIn: () => void;
  onNotConfigured: () => void;
  sheet?: boolean;
}) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const shake = useAnimationControls();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    const result = await signIn(password);
    setBusy(false);
    if (result === "ok") return onSignedIn();
    if (result === "not-configured") return onNotConfigured();
    setError(result === "wrong" ? "Wrong password. Try again." : "Couldn't reach the server. Try again.");
    setPassword("");
    void shake.start({ x: [0, -10, 10, -7, 7, -3, 3, 0], transition: { duration: 0.45 } });
  }

  return (
    <div
      className={`fixed inset-0 z-50 grid place-items-center px-6 ${sheet ? "bg-black/70 backdrop-blur-md" : "bg-black"}`}
      role={sheet ? "dialog" : undefined}
      aria-modal={sheet || undefined}
      aria-labelledby="admin-login-title"
    >
      <motion.form
        onSubmit={submit}
        animate={shake}
        className="flex w-full max-w-[300px] flex-col items-center text-center"
      >
        <Avatar size={84} />
        <h1 id="admin-login-title" className="mt-4 text-[19px] font-semibold tracking-[-0.01em] text-white">
          {site.name}
        </h1>
        <p className="mt-1 text-[13px] text-muted">
          {sheet ? "Your session ended. Sign in again — your edits are still here." : "Sign in to edit your site."}
        </p>
        <div className="relative mt-5 w-full">
          <input
            type="password"
            autoFocus
            autoComplete="current-password"
            aria-label="Password"
            placeholder="Enter Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-9 w-full rounded-full bg-white/[0.1] pr-10 pl-4 text-center text-[13.5px] text-white ring-1 ring-white/[0.14] outline-none backdrop-blur placeholder:text-white/40 focus:ring-2 focus:ring-white/40"
          />
          <button
            type="submit"
            aria-label="Sign in"
            disabled={!password || busy}
            className="absolute top-1/2 right-1.5 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-white text-[#0A0A0A] transition-opacity disabled:opacity-30"
          >
            {busy ? (
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-black" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            )}
          </button>
        </div>
        <p role="alert" className="mt-3 h-4 text-[12.5px] text-[#FF6961]">
          {error}
        </p>
      </motion.form>
    </div>
  );
}

export function NotSetUp() {
  const vars = [
    ["ADMIN_PASSWORD", "your password, 16 characters or more"],
    ["ADMIN_SESSION_SECRET", "a long random string (32+ characters)"],
    ["GITHUB_TOKEN", "a fine-grained GitHub token with Contents: Read and write on the portfolio repo"],
  ];
  return (
    <div className="grid h-dvh place-items-center overflow-y-auto bg-black px-6 py-10">
      <div className="w-full max-w-[460px]">
        <h1 className="text-[22px] font-bold tracking-[-0.02em] text-white">The admin isn&apos;t set up yet</h1>
        <p className="mt-2 text-[13.5px] leading-relaxed text-muted">
          Add these environment variables in Vercel → your project → Settings → Environment Variables, then redeploy.
          The full steps are in <code className="font-mono text-[12.5px] text-white/80">docs/admin-setup.md</code>.
        </p>
        <dl className="mt-5 divide-y divide-white/[0.06] rounded-xl bg-surface ring-1 ring-white/[0.08]">
          {vars.map(([name, what]) => (
            <div key={name} className="px-4 py-3">
              <dt className="font-mono text-[12.5px] text-white">{name}</dt>
              <dd className="mt-0.5 text-[12.5px] text-muted">{what}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

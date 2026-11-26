"use client";

import { useCallback, useEffect, useState } from "react";
import { getSession, loadContent, signOut, type Loaded } from "./api";
import { Editor } from "./Editor";
import { LoginScreen, NotSetUp } from "./LoginScreen";

type State =
  | { kind: "checking" }
  | { kind: "not-configured" }
  | { kind: "signed-out" }
  | { kind: "loading" }
  | { kind: "ready"; loaded: Loaded }
  | { kind: "error"; message: string };

/** Setup check → sign in → load the latest content from GitHub → edit. */
export function AdminApp() {
  const [state, setState] = useState<State>({ kind: "checking" });

  const load = useCallback(async () => {
    setState({ kind: "loading" });
    const result = await loadContent();
    if (result.ok) setState({ kind: "ready", loaded: result.loaded });
    else setState(result.signedOut ? { kind: "signed-out" } : { kind: "error", message: result.message });
  }, []);

  useEffect(() => {
    let cancelled = false;
    void getSession().then((session) => {
      if (cancelled) return;
      if ("error" in session) setState({ kind: "error", message: session.error });
      else if (!session.configured) setState({ kind: "not-configured" });
      else if (!session.signedIn) setState({ kind: "signed-out" });
      else void load();
    });
    return () => {
      cancelled = true;
    };
  }, [load]);

  switch (state.kind) {
    case "not-configured":
      return <NotSetUp />;
    case "signed-out":
      return <LoginScreen onSignedIn={load} onNotConfigured={() => setState({ kind: "not-configured" })} />;
    case "ready":
      return (
        <Editor
          loaded={state.loaded}
          onLogOut={async () => {
            await signOut();
            setState({ kind: "signed-out" });
          }}
          onReload={load}
        />
      );
    case "error":
      return (
        <Centered>
          <p className="max-w-[420px] text-[13.5px] leading-relaxed text-white">{state.message}</p>
          <button
            type="button"
            onClick={() => location.reload()}
            className="mt-4 h-8 rounded-[8px] bg-white px-4 text-[13px] font-medium text-[#0A0A0A]"
          >
            Try again
          </button>
        </Centered>
      );
    default:
      return (
        <Centered>
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/15 border-t-white" aria-label="Loading" />
        </Centered>
      );
  }
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex h-dvh flex-col items-center justify-center bg-black px-6 text-center">{children}</div>;
}

"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { introName } from "@/content/derived";
import { site } from "@/content/site";
import { tap } from "@/lib/haptics";
import { playKey, playWhoosh, unlockAudio } from "@/lib/sound";
import { Flight } from "./Flight";
import { landingPath, takeoffPath, type Point } from "./paths";

const NAME = introName(site.alias);
const START_DELAY_MS = 350;
const TAKEOFF_S = 1.3;
const LANDING_S = 1.5;

/**
 * idle     a brief beat of black before the plane appears
 * takeoff  the paper plane flies in, loops and flies off
 * typing   the name types out with key sounds
 * landing  the plane swoops back and lands as the real cursor
 * leaving  the intro fades away to reveal the page
 *
 * There's no "click to start": browsers keep audio muted until the visitor
 * clicks or presses a key, so sound switches on at their first interaction.
 */
type Phase = "idle" | "takeoff" | "typing" | "landing" | "leaving" | "done";
type FlightPlan = {
  d: string;
  duration: number;
  scales: [number, number, number, number];
};

export function Intro({ onLeave }: { onLeave?: () => void }) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [typed, setTyped] = useState(0);
  const [flight, setFlight] = useState<FlightPlan | null>(null);
  const reduceMotion = useReducedMotion();
  /** Last mouse position; null for touch, so the plane knows where to land. */
  const pointer = useRef<Point | null>(null);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = e.pointerType === "touch" ? null : { x: e.clientX, y: e.clientY };
    };
    // The first click/tap/key is the browser's permission to play sound.
    const unlock = () => unlockAudio();
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", unlock);
    window.addEventListener("keydown", unlock);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  function start() {
    unlockAudio(); // plays if this visitor's browser already allows sound
    if (reduceMotion) {
      setPhase("typing");
      return;
    }
    // From the mouse if we know where it is, otherwise fly in from the left.
    const from = pointer.current;
    setFlight({
      d: takeoffPath(from ?? { x: -60, y: innerHeight * 0.85 }, innerWidth, innerHeight),
      duration: TAKEOFF_S,
      scales: [from ? 1 : 1.8, 2.2, 2.2, 2],
    });
    playWhoosh(TAKEOFF_S);
    setPhase("takeoff");
  }

  const startFromTimer = useEffectEvent(start);
  useEffect(() => {
    const timer = window.setTimeout(() => startFromTimer(), START_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  /** Every way out of the intro ends here; the page underneath is told once. */
  const announcedLeave = useRef(false);
  function leave() {
    setFlight(null);
    setPhase("leaving");
    if (!announcedLeave.current) {
      announcedLeave.current = true;
      onLeave?.();
    }
  }
  const leaveFromTimer = useEffectEvent(() => leave());

  function onFlightDone() {
    if (phase === "takeoff") {
      setFlight(null);
      setPhase("typing");
    } else if (phase === "landing") {
      leave();
    }
  }

  // Esc skips the intro.
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.key === "Escape" && phase !== "leaving") leave();
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Type the name one key at a time, then send the plane back in to land.
  useEffect(() => {
    if (phase !== "typing") return;
    const timers: number[] = [];
    let at = 250;

    for (let i = 0; i < NAME.length; i++) {
      const char = NAME[i];
      timers.push(
        window.setTimeout(() => {
          setTyped(i + 1);
          playKey(char);
          tap(6);
        }, at),
      );
      at += 70 + Math.random() * 60 + (char === " " ? 60 : 0);
    }

    timers.push(
      window.setTimeout(() => {
        if (reduceMotion) {
          leaveFromTimer();
          return;
        }
        setFlight({
          d: landingPath(pointer.current, innerWidth, innerHeight),
          duration: LANDING_S,
          scales: [2, 2.2, 2, 1],
        });
        playWhoosh(LANDING_S);
        setPhase("landing");
      }, at + 450),
    );

    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase, reduceMotion]);

  if (phase === "done") return null;

  const flying = phase === "takeoff" || phase === "typing" || phase === "landing";

  return (
    <motion.div
      className="fixed inset-0 z-[2000] select-none bg-background"
      // Hide the real cursor while its plane is "away"; it reappears on landing.
      style={{
        cursor: flying ? "none" : undefined,
        pointerEvents: phase === "leaving" ? "none" : "auto",
      }}
      initial={false}
      animate={{ opacity: phase === "leaving" ? 0 : 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      onAnimationComplete={() => {
        if (phase === "leaving") setPhase("done");
      }}
      onPointerDown={(e) => {
        // Remember where the mouse is even if it never "moved" before the click.
        if (e.pointerType !== "touch") pointer.current = { x: e.clientX, y: e.clientY };
        tap();
      }}
    >
      <div className="absolute inset-0 flex items-center justify-center px-6">
        <h1
          aria-label={site.alias}
          className="relative whitespace-nowrap font-sans text-[clamp(1.75rem,7.5vw,6rem)] font-bold leading-none tracking-[-0.025em] text-ink"
        >
          {/* Full name, invisible, reserves the width so typing never shifts. */}
          <span className="invisible" aria-hidden>
            {NAME}
          </span>
          <span className="absolute inset-0 whitespace-pre text-left" aria-hidden>
            {NAME.slice(0, typed)}
            {phase !== "idle" && phase !== "takeoff" && (
              <span className="ml-[0.05em] inline-block h-[0.78em] w-[0.07em] translate-y-[0.04em] animate-blink bg-white" />
            )}
          </span>
        </h1>
      </div>

      {flight && <Flight key={flight.d} {...flight} onDone={onFlightDone} />}
    </motion.div>
  );
}

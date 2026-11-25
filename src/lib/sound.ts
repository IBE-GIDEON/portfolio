/**
 * Synthesised UI sounds (Web Audio, no audio files).
 *
 * Browsers only allow audio after a user gesture, so call `unlockAudio()`
 * from a click/keydown handler before playing anything. Until then every
 * play function is a silent no-op.
 */

import { useSyncExternalStore } from "react";
import { readSoundPref, writeSoundPref } from "./soundPrefs";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/* ---------- on/off setting (remembered between visits) ---------- */

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

let enabled = readSoundPref(storage());
const listeners = new Set<() => void>();

export function getSoundEnabled(): boolean {
  return enabled;
}

export function setSoundEnabled(on: boolean): void {
  enabled = on;
  writeSoundPref(storage(), on);
  listeners.forEach((cb) => cb());
}

export function subscribeSound(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** React hook: current on/off state; the server always renders "on". */
export function useSoundEnabled(): boolean {
  return useSyncExternalStore(subscribeSound, getSoundEnabled, () => true);
}

/** Audio is usable right now (unlocked by a gesture and switched on). */
function ready(): boolean {
  return enabled && ctx !== null && master !== null && noise !== null;
}

export function unlockAudio() {
  if (typeof window === "undefined") return;

  if (!ctx) {
    const AudioCtor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtor) return;

    ctx = new AudioCtor();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);

    // One second of white noise, reused as the raw material for every sound.
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }

  if (ctx.state === "suspended") void ctx.resume();
}

/** A short band-passed noise burst: the "tick" of a key. */
function tick(at: number, freq: number, q: number, gain: number, decay: number) {
  if (!ctx || !master || !noise) return;
  const src = ctx.createBufferSource();
  src.buffer = noise;

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.frequency.value = freq;
  band.Q.value = q;

  const env = ctx.createGain();
  env.gain.setValueAtTime(0, at);
  env.gain.linearRampToValueAtTime(gain, at + 0.001);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);

  src.connect(band).connect(env).connect(master);
  src.start(at, rand(0, 0.9), decay + 0.02);
}

/** A tiny pitched thump: the key bottoming out. */
function thump(at: number, freq: number, gain: number, decay: number) {
  if (!ctx || !master) return;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, at);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.55, at + decay);

  const env = ctx.createGain();
  env.gain.setValueAtTime(gain, at);
  env.gain.exponentialRampToValueAtTime(0.0001, at + decay);

  osc.connect(env).connect(master);
  osc.start(at);
  osc.stop(at + decay + 0.02);
}

/** A low-travel laptop key press + release. Space bar sounds deeper. */
export function playKey(char = "a") {
  if (!ready() || !ctx) return;
  const t = ctx.currentTime;
  const isSpace = char === " ";

  if (isSpace) {
    tick(t, rand(1300, 1700), 1.1, 0.55, 0.055);
    thump(t, rand(105, 125), 0.4, 0.08);
  } else {
    tick(t, rand(2900, 3900), 1.3, 0.5, 0.026);
    thump(t, rand(175, 225), 0.22, 0.045);
  }

  // Key coming back up: a quieter, brighter tick a few ms later.
  tick(t + rand(0.055, 0.085), rand(3600, 4600), 1.6, 0.13, 0.016);
}

/** A soft air "whoosh" for the paper plane, swelling mid-flight. */
export function playWhoosh(duration = 1.2, peak = 0.16) {
  if (!ready() || !ctx || !master || !noise) return;
  const t = ctx.currentTime;

  const src = ctx.createBufferSource();
  src.buffer = noise;
  src.loop = true;

  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.8;
  band.frequency.setValueAtTime(350, t);
  band.frequency.exponentialRampToValueAtTime(1600, t + duration * 0.45);
  band.frequency.exponentialRampToValueAtTime(450, t + duration);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(peak, t + duration * 0.4);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  src.connect(band).connect(env).connect(master);
  src.start(t);
  src.stop(t + duration + 0.05);
}

/* ---------- UI sounds for the desktop ---------- */

/** A short pitched blip that glides from one frequency to another. */
function blip(from: number, to: number, gain: number, duration: number) {
  if (!ready() || !ctx || !master) return;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(from, t);
  osc.frequency.exponentialRampToValueAtTime(to, t + duration);

  const env = ctx.createGain();
  env.gain.setValueAtTime(0.0001, t);
  env.gain.exponentialRampToValueAtTime(gain, t + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0001, t + duration);

  osc.connect(env).connect(master);
  osc.start(t);
  osc.stop(t + duration + 0.02);
}

/** Window opens: a soft rising pop. */
export function playPop() {
  blip(880, 1320, 0.12, 0.08);
}

/** Window closes: a softer falling pop. */
export function playClose() {
  blip(660, 440, 0.08, 0.07);
}

/** Menu or dock press: a tiny bright tick. */
export function playTick() {
  if (!ready() || !ctx) return;
  tick(ctx.currentTime, 4000, 1.5, 0.18, 0.015);
}

/** Window minimises into the dock: a short, quiet whoosh. */
export function playMinimize() {
  playWhoosh(0.35, 0.08);
}

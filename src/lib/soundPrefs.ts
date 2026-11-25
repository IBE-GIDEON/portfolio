const KEY = "gideon:sound";

/** Sound is on unless the visitor turned it off before. */
export function readSoundPref(storage: Pick<Storage, "getItem"> | null): boolean {
  try {
    return storage?.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function writeSoundPref(storage: Pick<Storage, "setItem"> | null, on: boolean): void {
  try {
    storage?.setItem(KEY, on ? "on" : "off");
  } catch {
    // Private mode / storage disabled: the setting just won't persist.
  }
}

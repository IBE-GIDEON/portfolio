type ClockOptions = { locale?: string; timeZone?: string };

function parts(date: Date, options: Intl.DateTimeFormatOptions, locale?: string) {
  const list = new Intl.DateTimeFormat(locale, { hourCycle: "h23", ...options }).formatToParts(date);
  return (type: Intl.DateTimeFormatPartTypes) => list.find((p) => p.type === type)?.value ?? "";
}

/** "Wed 25 Nov 14:32" — the macOS menu-bar clock, 24-hour. */
export function formatMenuClock(date: Date, opts: ClockOptions = {}): string {
  const get = parts(
    date,
    {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: opts.timeZone,
    },
    opts.locale,
  );
  return `${get("weekday")} ${get("day")} ${get("month")} ${get("hour")}:${get("minute")}`;
}

/** "14:32" in the given IANA time zone, 24-hour. */
export function localTimeIn(date: Date, timeZone: string, locale?: string): string {
  const get = parts(date, { hour: "2-digit", minute: "2-digit", timeZone }, locale);
  return `${get("hour")}:${get("minute")}`;
}

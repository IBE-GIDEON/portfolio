"use client";

/**
 * Form building blocks for the admin, styled like a dark System Settings
 * pane: grouped rows, inline fields, lists you can add to and reorder.
 */
import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import type { ContentError } from "@/content/schema";
import { ChevronDown, ChevronRight } from "@/ui/lineIcons";

/* ---------- errors ---------- */

export const errorAt = (errors: ContentError[], path: string) => errors.find((e) => e.path === path)?.message;

export const hasErrorsUnder = (errors: ContentError[], prefix: string) =>
  errors.some((e) => e.path === prefix || e.path.startsWith(`${prefix}.`));

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-[12px] leading-snug text-[#FF6961]">{message}</p>;
}

/* ---------- layout ---------- */

export function FormPage({ title, description, children }: { title: string; description?: string; children?: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[680px] px-5 pt-6 pb-24 sm:px-8 sm:pt-8">
      <h2 className="text-[22px] font-bold tracking-[-0.02em] text-white">{title}</h2>
      {description && <p className="mt-1 text-[13px] leading-relaxed text-muted">{description}</p>}
      <div className="mt-6 space-y-7">{children}</div>
    </div>
  );
}

export function Group({ title, footer, children }: { title?: string; footer?: ReactNode; children: ReactNode }) {
  return (
    <section>
      {title && <h3 className="mb-2 px-1 text-[13px] font-semibold text-white/90">{title}</h3>}
      <div className="divide-y divide-white/[0.06] rounded-xl bg-surface ring-1 ring-white/[0.08]">{children}</div>
      {footer && <div className="mt-2 px-1 text-[12px] leading-relaxed text-muted">{footer}</div>}
    </section>
  );
}

const input =
  "w-full rounded-[7px] bg-white/[0.06] px-2.5 py-[7px] text-[13.5px] text-white ring-1 ring-white/[0.09] outline-none transition-shadow placeholder:text-white/25 focus:bg-white/[0.08] focus:ring-2 focus:ring-white/35";

const invalid = "ring-[#FF6961]/70 focus:ring-[#FF6961]/80";

/** Label on the left, field on the right (stacks on narrow screens). */
export function Row({
  label,
  hint,
  error,
  htmlFor,
  stacked = false,
  children,
}: {
  label: string;
  hint?: ReactNode;
  error?: string;
  htmlFor?: string;
  stacked?: boolean;
  children: ReactNode;
}) {
  return (
    <div className={`px-3.5 py-3 ${stacked ? "" : "sm:flex sm:items-start sm:gap-4"}`}>
      <label
        htmlFor={htmlFor}
        className={`block text-[13.5px] font-medium text-white ${stacked ? "mb-2" : "mb-1.5 sm:mb-0 sm:w-[150px] sm:shrink-0 sm:pt-[7px]"}`}
      >
        {label}
      </label>
      <div className="min-w-0 flex-1">
        {children}
        <FieldError message={error} />
        {hint && !error && <p className="mt-1.5 text-[12px] leading-snug text-muted">{hint}</p>}
      </div>
    </div>
  );
}

export function TextRow({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  type = "text",
  list,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: ReactNode;
  type?: "text" | "email" | "url";
  list?: string;
}) {
  const id = useId();
  return (
    <Row label={label} hint={hint} error={error} htmlFor={id}>
      <input
        id={id}
        type={type}
        list={list}
        value={value}
        placeholder={placeholder}
        spellCheck={type === "text"}
        onChange={(e) => onChange(e.target.value)}
        className={`${input} ${error ? invalid : ""}`}
      />
    </Row>
  );
}

export function TextAreaRow({
  label,
  value,
  onChange,
  placeholder,
  error,
  hint,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  hint?: ReactNode;
  rows?: number;
}) {
  const id = useId();
  return (
    <Row label={label} hint={hint} error={error} htmlFor={id} stacked>
      <textarea
        id={id}
        rows={rows}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={`${input} resize-y leading-[1.55] ${error ? invalid : ""}`}
      />
    </Row>
  );
}

export function SelectRow<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  error?: string;
}) {
  const id = useId();
  return (
    <Row label={label} error={error} htmlFor={id}>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          className={`${input} appearance-none pr-8`}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1c1c1e]">
              {o.label}
            </option>
          ))}
        </select>
        <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-muted">
          <ChevronDown size={13} />
        </span>
      </div>
    </Row>
  );
}

/** A Mac segmented control. */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex rounded-[8px] bg-white/[0.06] p-[2px] ring-1 ring-white/[0.08]">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-[6px] px-3 py-[5px] text-[12.5px] font-medium transition-colors ${
            value === o.value ? "bg-white text-[#0A0A0A] shadow-[0_1px_2px_rgb(0_0_0/0.4)]" : "text-white/75 hover:text-white"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

/** A list of short words, edited as chips: type and press Enter (or comma) to add. */
export function TagsRow({
  label,
  items,
  onChange,
  placeholder = "Add…",
  error,
}: {
  label: string;
  items: string[];
  onChange: (items: string[]) => void;
  placeholder?: string;
  error?: string;
}) {
  const id = useId();
  const [text, setText] = useState("");
  const add = () => {
    const value = text.trim().replace(/,$/, "").trim();
    if (value && !items.includes(value)) onChange([...items, value]);
    setText("");
  };
  return (
    <Row label={label} error={error} htmlFor={id}>
      <div className={`flex flex-wrap gap-1.5 rounded-[7px] bg-white/[0.06] p-1.5 ring-1 ring-white/[0.09] focus-within:ring-2 focus-within:ring-white/35 ${error ? invalid : ""}`}>
        {items.map((item, i) => (
          <span key={`${item}-${i}`} className="inline-flex items-center gap-1 rounded-[6px] bg-white/[0.1] py-[3px] pr-1 pl-2 text-[12.5px] text-white">
            {item}
            <button
              type="button"
              aria-label={`Remove ${item}`}
              onClick={() => onChange(items.filter((_, j) => j !== i))}
              className="grid h-4 w-4 place-items-center rounded-[4px] text-white/60 hover:bg-white/15 hover:text-white"
            >
              ×
            </button>
          </span>
        ))}
        <input
          id={id}
          value={text}
          placeholder={placeholder}
          onChange={(e) => {
            // A comma finishes a chip, like pressing Enter (pasting "a, b, c" adds three).
            const parts = e.target.value.split(",");
            const rest = parts.pop() ?? "";
            const added = parts.map((s) => s.trim()).filter((s) => s && !items.includes(s));
            if (added.length) onChange([...items, ...new Set(added)]);
            setText(rest);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            } else if (e.key === "Backspace" && !text && items.length) {
              onChange(items.slice(0, -1));
            }
          }}
          onBlur={add}
          className="min-w-[90px] flex-1 bg-transparent px-1 py-[3px] text-[13px] text-white outline-none placeholder:text-white/25"
        />
      </div>
    </Row>
  );
}

/* ---------- lists ---------- */

const iconButton =
  "grid h-7 w-7 place-items-center rounded-[6px] text-[13px] text-white/60 transition-colors hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-25";

/** Move up, move down, and remove (asks once: the button turns red, a second click removes). */
function ItemControls({
  index,
  count,
  label,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  label: string;
  onMove: (to: number) => void;
  onRemove: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return;
    const timer = setTimeout(() => setConfirming(false), 3000);
    return () => clearTimeout(timer);
  }, [confirming]);
  return (
    <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
      <button type="button" className={iconButton} disabled={index === 0} onClick={() => onMove(index - 1)} aria-label={`Move ${label} up`}>
        ↑
      </button>
      <button type="button" className={iconButton} disabled={index === count - 1} onClick={() => onMove(index + 1)} aria-label={`Move ${label} down`}>
        ↓
      </button>
      {confirming ? (
        <button
          type="button"
          onClick={onRemove}
          className="ml-1 h-7 rounded-[6px] bg-[#FF453A] px-2.5 text-[12px] font-semibold text-white"
        >
          Remove
        </button>
      ) : (
        <button type="button" className={iconButton} onClick={() => setConfirming(true)} aria-label={`Remove ${label}`}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" />
          </svg>
        </button>
      )}
    </div>
  );
}

/**
 * Add, remove, and reorder a list. `expandable` lists show one line per
 * item and open the item's fields on click (good for long items like projects).
 */
export function ListEditor<T>({
  items,
  onChange,
  render,
  newItem,
  itemLabel,
  itemMeta,
  addLabel = "Add",
  expandable = false,
  invalidAt,
  emptyText = "Nothing here yet.",
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, update: (fn: (item: T) => T | void) => void, index: number) => ReactNode;
  newItem: () => T;
  itemLabel: (item: T, index: number) => string;
  itemMeta?: (item: T, index: number) => ReactNode;
  addLabel?: string;
  expandable?: boolean;
  /** Marks items with errors so they stand out while closed. */
  invalidAt?: (index: number) => boolean;
  emptyText?: string;
}) {
  const [open, setOpen] = useState<number | null>(null);
  const lastAdded = useRef<number | null>(null);

  const update = (index: number) => (fn: (item: T) => T | void) => {
    const copy = structuredClone(items[index]);
    const next = [...items];
    next[index] = (fn(copy) ?? copy) as T;
    onChange(next);
  };
  const move = (from: number, to: number) => {
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
    setOpen((o) => (o === from ? to : o === to ? from : o));
  };
  const remove = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    setOpen((o) => (o === null || o === index ? null : o > index ? o - 1 : o));
  };
  const add = () => {
    onChange([...items, newItem()]);
    lastAdded.current = items.length;
    if (expandable) setOpen(items.length);
  };

  return (
    <div className="divide-y divide-white/[0.06] rounded-xl bg-surface ring-1 ring-white/[0.08]">
      {items.length === 0 && <p className="px-3.5 py-3 text-[13px] text-muted">{emptyText}</p>}
      {items.map((item, index) => {
        const label = itemLabel(item, index) || "Untitled";
        const isOpen = !expandable || open === index;
        const bad = invalidAt?.(index);
        return (
          <div key={index} className={expandable && isOpen ? "bg-white/[0.02]" : ""}>
            <div
              className={`flex items-center gap-2 px-3.5 py-2 ${expandable ? "cursor-pointer select-none hover:bg-white/[0.03]" : ""}`}
              onClick={expandable ? () => setOpen(isOpen ? null : index) : undefined}
              role={expandable ? "button" : undefined}
              aria-expanded={expandable ? isOpen : undefined}
            >
              {expandable && (
                <span className="text-muted">{isOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}</span>
              )}
              <span className={`min-w-0 flex-1 truncate text-[13.5px] ${expandable ? "font-medium text-white" : "text-muted"}`}>
                {label}
                {bad && <span className="ml-2 text-[12px] font-normal text-[#FF6961]">Needs a fix</span>}
              </span>
              {itemMeta && <span className="hidden shrink-0 text-[12px] text-muted sm:inline">{itemMeta(item, index)}</span>}
              <ItemControls index={index} count={items.length} label={label} onMove={(to) => move(index, to)} onRemove={() => remove(index)} />
            </div>
            {isOpen && <div className={expandable ? "border-t border-white/[0.06]" : ""}>{render(item, update(index), index)}</div>}
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        className="flex w-full items-center gap-2 rounded-b-xl px-3.5 py-2.5 text-left text-[13.5px] font-medium text-white/80 transition-colors hover:bg-white/[0.04] hover:text-white"
      >
        <span className="grid h-[18px] w-[18px] place-items-center rounded-full bg-white/[0.12] text-[13px] leading-none">+</span>
        {addLabel}
      </button>
    </div>
  );
}

/* ---------- pictures ---------- */

/** A picture with a "Choose…" button; the file goes up for processing, then shows as a preview. */
export function ImageRow({
  label,
  src,
  aspect,
  onPick,
  onRemove,
  busy,
  error,
  hint,
}: {
  label: string;
  src: string | null;
  aspect: "16/10" | "1/1";
  onPick: (file: File) => void;
  onRemove?: () => void;
  busy: boolean;
  error?: string;
  hint?: ReactNode;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  return (
    <Row label={label} error={error} hint={hint}>
      <div className="flex items-center gap-3.5">
        <div
          className={`relative shrink-0 overflow-hidden bg-white/[0.05] ring-1 ring-white/[0.1] ${
            aspect === "1/1" ? "h-16 w-16 rounded-full" : "h-[75px] w-[120px] rounded-[8px]"
          }`}
        >
          {src ? (
            // eslint-disable-next-line @next/next/no-img-element -- previews include unsaved data: URLs
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center text-[11px] text-white/30">None</span>
          )}
          {busy && <span className="absolute inset-0 grid place-items-center bg-black/60 text-[11px] text-white">Working…</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => fileInput.current?.click()}
            className="h-8 rounded-[8px] bg-white/[0.08] px-3 text-[12.5px] font-medium text-white ring-1 ring-white/[0.1] hover:bg-white/[0.12] disabled:opacity-50"
          >
            {src ? "Replace…" : "Choose…"}
          </button>
          {src && onRemove && (
            <button type="button" disabled={busy} onClick={onRemove} className="h-8 rounded-[8px] px-3 text-[12.5px] text-white/60 hover:bg-white/[0.06] hover:text-white">
              Remove
            </button>
          )}
        </div>
        <input
          ref={fileInput}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onPick(file);
          }}
        />
      </div>
    </Row>
  );
}

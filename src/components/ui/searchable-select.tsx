"use client";

import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type SearchableOption = { value: string; label: string };
export type SearchableGroup = {
  group: string;
  label: string;
  options: SearchableOption[];
};

export function SearchableSelect({
  value,
  onValueChange,
  groups,
  placeholder = "Selecione...",
  searchPlaceholder = "Buscar...",
  disabled,
  className,
  triggerClassName,
  id,
  name,
}: {
  value: string | null | undefined;
  onValueChange: (v: string) => void;
  groups: SearchableGroup[];
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
  id?: string;
  /** When set, a hidden <input name=name value=value> is rendered for form submission. */
  name?: string;
}) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [activeIdx, setActiveIdx] = React.useState(0);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLDivElement>(null);

  // Flatten visible options (after filtering) so keyboard nav can iterate.
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        options: q
          ? g.options.filter(
              (o) =>
                o.label.toLowerCase().includes(q) ||
                o.value.toLowerCase().includes(q),
            )
          : g.options,
      }))
      .filter((g) => g.options.length > 0);
  }, [groups, query]);

  const flat = React.useMemo(() => filtered.flatMap((g) => g.options), [filtered]);

  const currentLabel = React.useMemo(() => {
    for (const g of groups) {
      const found = g.options.find((o) => o.value === value);
      if (found) return found.label;
    }
    return null;
  }, [groups, value]);

  // Close on click outside.
  React.useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Focus search input when opening + reset state.
  React.useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      // Small delay so the input is mounted.
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  // Keep active item in view as user navigates.
  React.useEffect(() => {
    if (!open) return;
    const list = listRef.current;
    if (!list) return;
    const el = list.querySelector<HTMLElement>(`[data-idx="${activeIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [activeIdx, open]);

  function select(v: string) {
    onValueChange(v);
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, Math.max(0, flat.length - 1)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const opt = flat[activeIdx];
      if (opt) select(opt.value);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {name && <input type="hidden" name={name} value={value ?? ""} />}
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          triggerClassName,
        )}
      >
        <span className={cn("truncate", !currentLabel && "text-muted-foreground")}>
          {currentLabel ?? placeholder}
        </span>
        <ChevronDown className="ml-2 size-4 shrink-0 opacity-50" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 min-w-[var(--radix-select-trigger-width)] rounded-md border bg-popover text-popover-foreground shadow-md"
          onKeyDown={onKeyDown}
        >
          <div className="border-b border-slate-100 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIdx(0);
                }}
                onKeyDown={onKeyDown}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-md border border-slate-200 bg-white pl-8 pr-7 text-sm placeholder:text-slate-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Limpar busca"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>

          <div
            ref={listRef}
            role="listbox"
            // Barra de scroll vertical NATIVA + estilizada à direita.
            // O ::-webkit-scrollbar é definido em globals.css mais abaixo.
            className="searchable-scroll max-h-72 overflow-y-auto overflow-x-hidden p-1"
          >
            {flat.length === 0 ? (
              <p className="px-3 py-6 text-center text-xs text-slate-500">
                Nenhum resultado para &quot;{query}&quot;.
              </p>
            ) : (
              filtered.map((g) => {
                const baseIdx = filtered
                  .slice(0, filtered.indexOf(g))
                  .reduce((acc, prev) => acc + prev.options.length, 0);
                return (
                  <div key={g.group}>
                    <div className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                      {g.label}
                    </div>
                    {g.options.map((o, i) => {
                      const idx = baseIdx + i;
                      const isActive = idx === activeIdx;
                      const isSelected = o.value === value;
                      return (
                        <button
                          key={o.value}
                          data-idx={idx}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => select(o.value)}
                          className={cn(
                            "flex w-full items-center justify-between gap-2 rounded px-3 py-1.5 text-left text-sm",
                            isActive ? "bg-primary/10 text-primary" : "text-slate-700",
                          )}
                        >
                          <span className="truncate">{o.label}</span>
                          {isSelected && (
                            <Check className="size-4 shrink-0 text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

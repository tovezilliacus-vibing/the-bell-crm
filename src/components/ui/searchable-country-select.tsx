"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { COUNTRY_OPTIONS } from "@/lib/countries";

const MAX_VISIBLE_OPTIONS = 10;
const OPTION_HEIGHT = 36;

export interface SearchableCountrySelectProps {
  name: string;
  id?: string;
  value?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function SearchableCountrySelect({
  name,
  id,
  value = "",
  placeholder = "Search or select country",
  className,
  disabled,
}: SearchableCountrySelectProps) {
  const [query, setQuery] = React.useState(value);
  const [selectedValue, setSelectedValue] = React.useState(value);
  const [open, setOpen] = React.useState(false);
  const [highlightIndex, setHighlightIndex] = React.useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter((opt) =>
      opt.label.toLowerCase().includes(q)
    );
  }, [query]);

  const visibleOptions = filtered.slice(0, 200);
  const selectedOption = COUNTRY_OPTIONS.find((o) => o.value === selectedValue);

  React.useEffect(() => {
    setQuery(value);
    setSelectedValue(value);
  }, [value]);

  React.useEffect(() => {
    if (!open) return;
    setHighlightIndex(0);
  }, [open, query]);

  React.useEffect(() => {
    if (!open || highlightIndex < 0) return;
    const el = listRef.current?.children[highlightIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightIndex, open]);

  React.useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayValue = open ? query : (selectedOption?.label ?? query);

  const handleSelect = (option: { value: string; label: string }) => {
    setSelectedValue(option.value);
    setQuery(option.label);
    setOpen(false);
    setHighlightIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        e.preventDefault();
        setOpen(true);
      }
      return;
    }
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightIndex((i) => (i < visibleOptions.length - 1 ? i + 1 : i));
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightIndex((i) => (i > 0 ? i - 1 : 0));
        break;
      case "Enter":
        e.preventDefault();
        if (visibleOptions[highlightIndex]) {
          handleSelect(visibleOptions[highlightIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setOpen(false);
        setQuery(selectedOption?.label ?? selectedValue);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <input
        type="text"
        id={id}
        autoComplete="off"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls={open ? "country-list" : undefined}
        aria-activedescendant={open && visibleOptions[highlightIndex] ? `country-opt-${highlightIndex}` : undefined}
        value={displayValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          const exact = COUNTRY_OPTIONS.find((o) => o.label.toLowerCase() === query.trim().toLowerCase());
          if (exact) {
            setSelectedValue(exact.value);
            setQuery(exact.label);
          }
          setOpen(false);
        }}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
        )}
      />
      <input type="hidden" name={name} value={selectedValue} />
      {open && (
        <ul
          ref={listRef}
          id="country-list"
          role="listbox"
          className="absolute z-50 mt-1 w-full overflow-auto rounded-md border border-input bg-popover py-1 shadow-md"
          style={{ maxHeight: MAX_VISIBLE_OPTIONS * OPTION_HEIGHT }}
        >
          {visibleOptions.length === 0 ? (
            <li className="px-3 py-2 text-sm text-muted-foreground">No country found</li>
          ) : (
            visibleOptions.map((option, index) => (
              <li
                key={option.value}
                id={`country-opt-${index}`}
                role="option"
                aria-selected={index === highlightIndex}
                className={cn(
                  "cursor-pointer px-3 py-2 text-sm outline-none",
                  index === highlightIndex && "bg-accent text-accent-foreground"
                )}
                style={{ height: OPTION_HEIGHT, boxSizing: "border-box" }}
                onMouseEnter={() => setHighlightIndex(index)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(option);
                }}
              >
                {option.label}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

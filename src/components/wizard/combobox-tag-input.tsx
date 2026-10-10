"use client";

import { useId, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

/**
 * Free-text tag input with autocomplete suggestions. Presets are offered as
 * suggestions, not as the only options — typing something not in the list
 * just adds it as a custom tag, so the field works the same way regardless
 * of what field of study or industry the student is in.
 */
export function ComboboxTagInput({
  options,
  value,
  onChange,
  placeholder = "Start typing to search or add your own…",
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const normalizedValue = value.map((v) => v.toLowerCase());
  const suggestions =
    query.trim().length === 0
      ? []
      : options
          .filter(
            (o) =>
              !normalizedValue.includes(o.toLowerCase()) &&
              o.toLowerCase().includes(query.trim().toLowerCase())
          )
          .slice(0, 8);

  function commit(raw: string) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const existingOption = options.find((o) => o.toLowerCase() === trimmed.toLowerCase());
    const canonical = existingOption ?? trimmed;
    if (!normalizedValue.includes(canonical.toLowerCase())) {
      onChange([...value, canonical]);
    }
    setQuery("");
    setActiveIndex(-1);
    setOpen(false);
  }

  function remove(entry: string) {
    onChange(value.filter((v) => v !== entry));
  }

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((entry) => (
            <Badge key={entry} variant="secondary" className="gap-1 py-1.5 pl-3 pr-2">
              {entry}
              <button type="button" onClick={() => remove(entry)} aria-label={`Remove ${entry}`}>
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <Input
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={activeIndex >= 0 ? `${listId}-option-${activeIndex}` : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              if (suggestions.length > 0) setActiveIndex((i) => (i + 1) % suggestions.length);
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              if (suggestions.length > 0)
                setActiveIndex((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
            } else if (e.key === "Enter") {
              e.preventDefault();
              if (activeIndex >= 0 && suggestions[activeIndex]) {
                commit(suggestions[activeIndex]);
              } else {
                commit(query);
              }
            } else if (e.key === "Escape") {
              setOpen(false);
              setActiveIndex(-1);
            } else if (e.key === "Backspace" && query === "" && value.length > 0) {
              remove(value[value.length - 1]);
            }
          }}
        />

        {open && suggestions.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md"
          >
            {suggestions.map((option, i) => (
              <li
                key={option}
                id={`${listId}-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                // onMouseDown (not onClick) fires before the input's onBlur closes the list
                onMouseDown={(e) => {
                  e.preventDefault();
                  commit(option);
                }}
                className={cn(
                  "cursor-pointer rounded-sm px-2 py-1.5 text-sm",
                  i === activeIndex ? "bg-indigo-600 text-white" : "hover:bg-muted"
                )}
              >
                {option}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

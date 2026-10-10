"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OptionToggleGrid } from "@/components/wizard/option-toggle-grid";

/**
 * A grid of toggleable preset options plus a free-form "add your own" input,
 * backed by a single flat string array (presets and custom entries aren't
 * distinguished once added — see spec sections 14/15/16, "allow custom
 * entries").
 */
export function TagMultiSelect({
  options,
  value,
  onChange,
  placeholder = "Add your own…",
}: {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [customInput, setCustomInput] = useState("");

  function addCustom() {
    const trimmed = customInput.trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setCustomInput("");
  }

  const customEntries = value.filter((v) => !options.includes(v));

  return (
    <div className="space-y-3">
      <OptionToggleGrid options={options} value={value} onChange={onChange} />

      {customEntries.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {customEntries.map((entry) => (
            <Badge key={entry} variant="secondary" className="gap-1 py-1.5 pl-3 pr-2">
              {entry}
              <button
                type="button"
                onClick={() => onChange(value.filter((v) => v !== entry))}
                aria-label={`Remove ${entry}`}
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={placeholder}
          aria-label={placeholder}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
        <Button type="button" variant="outline" onClick={addCustom} aria-label="Add">
          <Plus className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

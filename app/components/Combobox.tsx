// app/components/Combobox.tsx
"use client";

import { useState } from "react";

interface ComboboxProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function Combobox({ options, value, onChange, placeholder }: ComboboxProps) {
  const [query, setQuery] = useState("");

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        className="w-full border rounded-md px-3 py-2"
        placeholder={placeholder}
        value={query || value}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => {
          if (query && !filtered.length) onChange(query);
        }}
      />
      {filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full rounded-md mt-1 max-h-40 overflow-y-auto">
          {filtered.map((o) => (
            <li
              key={o.value}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => {
                onChange(o.value);
                setQuery("");
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

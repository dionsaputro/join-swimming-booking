"use client";

import { useState } from "react";

interface CurrencyInputProps {
  label?: string;
  value: string;
  onChange: (rawValue: string) => void;
  placeholder?: string;
  error?: string;
}

function formatCurrency(value: string): string {
  const num = value.replace(/\D/g, "");
  if (!num) return "";
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function unformat(value: string): string {
  return value.replace(/\./g, "");
}

export default function CurrencyInput({ label, value, onChange, placeholder = "0", error }: CurrencyInputProps) {
  const [display, setDisplay] = useState(formatCurrency(value));

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = unformat(e.target.value);
    setDisplay(formatCurrency(raw));
    onChange(raw);
  }

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-semibold text-gray-700">{label}</label>
      )}
      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">Rp</span>
        <input
          type="text"
          inputMode="numeric"
          value={display}
          onChange={handleChange}
          placeholder={placeholder}
          className={`
            w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-white
            text-sm text-gray-800 placeholder:text-gray-400
            focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500
            transition-all duration-200
            ${error ? "border-rose-300 focus:ring-rose-500/20 focus:border-rose-500" : ""}
          `}
        />
      </div>
      {error && <p className="text-xs text-rose-500 font-medium">{error}</p>}
    </div>
  );
}

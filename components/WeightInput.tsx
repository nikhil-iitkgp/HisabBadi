"use client";

import { ChangeEvent, KeyboardEvent, useState } from "react";
import Button from "./Button";

interface WeightInputProps {
  label: string;
  bulkWeightLabel: string;
  bulkWeightPlaceholder: string;
  clearWeightsLabel: string;
  values: string[];
  error?: string;
  onChange: (values: string[]) => void;
}

const sanitizeWeightValue = (value: string): string =>
  value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

export default function WeightInput({
  label,
  bulkWeightLabel,
  bulkWeightPlaceholder,
  clearWeightsLabel,
  values,
  error,
  onChange,
}: WeightInputProps) {
  const [entryValue, setEntryValue] = useState("");

  const addWeight = () => {
    const sanitized = sanitizeWeightValue(entryValue).trim();
    const parsed = Number.parseFloat(sanitized);
    if (!sanitized || !Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    onChange([...values, sanitized]);
    setEntryValue("");
  };

  const deleteWeight = (index: number) => {
    const next = values.filter((_, rowIndex) => rowIndex !== index);
    onChange(next);
  };

  const handleEntryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addWeight();
  };

  const applyBulkWeights = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const tokens = event.target.value
      .trim()
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return;
    }

    onChange(tokens.map((token) => sanitizeWeightValue(token)));
  };

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {values.length}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <input
          inputMode="decimal"
          value={entryValue}
          onChange={(event) =>
            setEntryValue(sanitizeWeightValue(event.target.value))
          }
          onKeyDown={handleEntryKeyDown}
          placeholder="Enter weight (e.g. 58.9) and press Enter"
          className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      {values.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-3">
          <div className="flex flex-wrap gap-2">
            {values.map((value, index) => (
              <span
                key={`${value}-${index}`}
                className="relative inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1.5 pr-7 text-xs font-semibold text-slate-700"
              >
                {value}
                <button
                  type="button"
                  onClick={() => deleteWeight(index)}
                  className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700"
                  aria-label={`Remove weight ${value}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <p className="mt-2 text-xs text-slate-600">{values.join(" ")}</p>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button
          onClick={() => {
            onChange([]);
            setEntryValue("");
          }}
          variant="secondary"
          className="flex-1"
        >
          {clearWeightsLabel}
        </Button>
      </div>

      <div className="hidden space-y-1 lg:block">
        <label className="text-xs font-medium text-slate-600">
          {bulkWeightLabel}
        </label>
        <textarea
          rows={3}
          onChange={applyBulkWeights}
          placeholder={bulkWeightPlaceholder}
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>

      {error ? (
        <p className="text-xs font-medium text-red-600">{error}</p>
      ) : null}
    </section>
  );
}

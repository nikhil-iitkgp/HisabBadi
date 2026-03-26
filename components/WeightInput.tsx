"use client";

import {
  ChangeEvent,
  KeyboardEvent,
  useEffect,
  useMemo,
  useState,
  useRef,
} from "react";
import { WeightInputMode } from "@/utils/types";
import Button from "./Button";

interface WeightInputProps {
  label: string;
  bulkWeightLabel: string;
  bulkWeightPlaceholder: string;
  clearWeightsLabel: string;
  undoLastWeightLabel: string;
  weightInputModeLabel: string;
  singleRowModeLabel: string;
  tableModeLabel: string;
  rowsLabel: string;
  columnsLabel: string;
  gridHint: string;
  values: string[];
  rows: number;
  columns: number;
  mode: WeightInputMode;
  error?: string;
  onChange: (values: string[]) => void;
  onRowsChange: (rows: number) => void;
  onColumnsChange: (columns: number) => void;
  onModeChange: (mode: WeightInputMode) => void;
}

const MIN_GRID_SIZE = 1;
const GRID_SCROLL_COLUMN_THRESHOLD = 10;
const GRID_SCROLL_ROW_THRESHOLD = 20;
const DEFAULT_TABLE_COLUMNS = 5;

export const sanitizeWeightValue = (value: string): string =>
  value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

const clampGridSize = (value: number): number => Math.max(MIN_GRID_SIZE, value);

const toCellIndex = (row: number, column: number, columns: number): number =>
  row * columns + column;

const buildGridValues = (
  values: string[],
  rows: number,
  columns: number,
): string[] => {
  const totalCells = rows * columns;
  return Array.from({ length: totalCells }, (_, index) => values[index] ?? "");
};

const getCompactEntryValues = (
  values: string[],
  rows: number,
  columns: number,
): string[] =>
  gridValuesToEntryOrder(buildGridValues(values, rows, columns), rows, columns)
    .map((value) => sanitizeWeightValue(value).trim())
    .filter((value) => value !== "");

const gridValuesToEntryOrder = (
  gridValues: string[],
  rows: number,
  columns: number,
): string[] => {
  const orderedValues: string[] = [];

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      orderedValues.push(gridValues[toCellIndex(row, column, columns)] ?? "");
    }
  }

  return orderedValues;
};

const entryOrderToGridValues = (
  entryValues: string[],
  rows: number,
  columns: number,
): string[] => {
  const gridValues = Array.from({ length: rows * columns }, () => "");
  let entryIndex = 0;

  for (let column = 0; column < columns; column += 1) {
    for (let row = 0; row < rows; row += 1) {
      gridValues[toCellIndex(row, column, columns)] =
        entryValues[entryIndex] ?? "";
      entryIndex += 1;
    }
  }

  return gridValues;
};

export default function WeightInput({
  label,
  bulkWeightLabel,
  bulkWeightPlaceholder,
  clearWeightsLabel,
  undoLastWeightLabel,
  weightInputModeLabel,
  singleRowModeLabel,
  tableModeLabel,
  rowsLabel,
  columnsLabel,
  gridHint,
  values,
  rows,
  columns,
  mode,
  error,
  onChange,
  onRowsChange,
  onColumnsChange,
  onModeChange,
}: WeightInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [entryValue, setEntryValue] = useState("");
  const safeRows = clampGridSize(rows);
  const safeColumns = clampGridSize(columns);
  const gridValues = useMemo(
    () => buildGridValues(values, safeRows, safeColumns),
    [safeColumns, safeRows, values],
  );
  const [rowsInputValue, setRowsInputValue] = useState(String(safeRows));
  const [columnsInputValue, setColumnsInputValue] = useState(
    String(safeColumns),
  );

  useEffect(() => {
    setRowsInputValue(String(safeRows));
  }, [safeRows]);

  useEffect(() => {
    setColumnsInputValue(String(safeColumns));
  }, [safeColumns]);

  useEffect(() => {
    const normalizedValues = buildGridValues(values, safeRows, safeColumns);
    const didRowsChange = safeRows !== rows;
    const didColumnsChange = safeColumns !== columns;
    const didValuesChange =
      normalizedValues.length !== values.length ||
      normalizedValues.some((value, index) => value !== (values[index] ?? ""));

    if (didRowsChange) {
      onRowsChange(safeRows);
    }

    if (didColumnsChange) {
      onColumnsChange(safeColumns);
    }

    if (didValuesChange) {
      onChange(normalizedValues);
    }
  }, [
    columns,
    onChange,
    onColumnsChange,
    onRowsChange,
    rows,
    safeColumns,
    safeRows,
    values,
  ]);

  const enteredCount = gridValues.filter((value) => value.trim() !== "").length;

  const focusCell = (row: number, column: number) => {
    if (row < 0 || column < 0 || row >= safeRows || column >= safeColumns) {
      return;
    }

    inputRefs.current[toCellIndex(row, column, safeColumns)]?.focus();
  };

  const moveToNextEntryCell = (row: number, column: number) => {
    if (row + 1 < safeRows) {
      focusCell(row + 1, column);
      return;
    }

    if (column + 1 < safeColumns) {
      focusCell(0, column + 1);
      return;
    }

    inputRefs.current[toCellIndex(row, column, safeColumns)]?.blur();
  };

  const updateCell = (row: number, column: number, nextValue: string) => {
    const nextGridValues = [...gridValues];
    nextGridValues[toCellIndex(row, column, safeColumns)] =
      sanitizeWeightValue(nextValue);
    onChange(nextGridValues);
  };

  const compactTableGrid = (sourceValues: string[] = gridValues) => {
    const compactValues = getCompactEntryValues(
      sourceValues,
      safeRows,
      safeColumns,
    );
    onChange(entryOrderToGridValues(compactValues, safeRows, safeColumns));
  };

  const handleCellKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    row: number,
    column: number,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      compactTableGrid();
      moveToNextEntryCell(row, column);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      compactTableGrid();
      focusCell(row - 1, column);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      compactTableGrid();
      focusCell(row + 1, column);
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      compactTableGrid();
      focusCell(row, column - 1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      compactTableGrid();
      focusCell(row, column + 1);
    }
  };

  const applyRowsChange = (nextRowsValue: string) => {
    const parsedRows = Number.parseInt(nextRowsValue, 10);
    const nextRows = clampGridSize(
      Number.isFinite(parsedRows) ? parsedRows : 1,
    );
    const compactValues = getCompactEntryValues(values, safeRows, safeColumns);
    const nextColumns = Math.max(
      1,
      compactValues.length > 0 ? Math.ceil(compactValues.length / nextRows) : 1,
    );
    onRowsChange(nextRows);
    onColumnsChange(nextColumns);
    onChange(entryOrderToGridValues(compactValues, nextRows, nextColumns));
  };

  const applyColumnsChange = (nextColumnsValue: string) => {
    const parsedColumns = Number.parseInt(nextColumnsValue, 10);
    const nextColumns = clampGridSize(
      Number.isFinite(parsedColumns) ? parsedColumns : 1,
    );
    const compactValues = getCompactEntryValues(values, safeRows, safeColumns);
    const nextRows = Math.max(
      1,
      compactValues.length > 0
        ? Math.ceil(compactValues.length / nextColumns)
        : 1,
    );
    onRowsChange(nextRows);
    onColumnsChange(nextColumns);
    onChange(entryOrderToGridValues(compactValues, nextRows, nextColumns));
  };

  const handleRowsInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/[^0-9]/g, "");
    setRowsInputValue(nextValue);
  };

  const handleColumnsInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextValue = event.target.value.replace(/[^0-9]/g, "");
    setColumnsInputValue(nextValue);
  };

  const commitRowsInput = () => {
    applyRowsChange(rowsInputValue);
  };

  const commitColumnsInput = () => {
    applyColumnsChange(columnsInputValue);
  };

  const applyBulkWeights = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const tokens = event.target.value
      .trim()
      .split(/\s+/)
      .map((token) => sanitizeWeightValue(token).trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      return;
    }

    if (mode === "single") {
      onRowsChange(1);
      onColumnsChange(Math.max(tokens.length, 1));
      onChange(tokens);
      return;
    }

    const nextColumns = Math.max(safeColumns, DEFAULT_TABLE_COLUMNS);
    const nextRows = Math.max(1, Math.ceil(tokens.length / nextColumns));
    onRowsChange(nextRows);
    onColumnsChange(nextColumns);
    onChange(entryOrderToGridValues(tokens, nextRows, nextColumns));
  };

  const clearWeights = () => {
    onChange(buildGridValues([], safeRows, safeColumns));
    setEntryValue("");
  };

  const switchToListMode = () => {
    const compactValues = getCompactEntryValues(values, safeRows, safeColumns);
    onModeChange("single");
    onRowsChange(1);
    onColumnsChange(Math.max(compactValues.length, 1));
    onChange(compactValues);
  };

  const switchToTableMode = () => {
    const compactValues = getCompactEntryValues(values, safeRows, safeColumns);
    const nextColumns = DEFAULT_TABLE_COLUMNS;
    const nextRows = Math.max(1, Math.ceil(compactValues.length / nextColumns));
    onModeChange("table");
    onRowsChange(nextRows);
    onColumnsChange(nextColumns);
    onChange(entryOrderToGridValues(compactValues, nextRows, nextColumns));
  };

  const addListWeight = () => {
    const sanitized = sanitizeWeightValue(entryValue).trim();
    const parsed = Number.parseFloat(sanitized);
    if (!sanitized || !Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    const nextValues = [
      ...values.filter((value) => value.trim() !== ""),
      sanitized,
    ];
    onChange(nextValues);
    onRowsChange(1);
    onColumnsChange(Math.max(nextValues.length, 1));
    setEntryValue("");
  };

  const deleteListWeight = (index: number) => {
    const nextValues = values.filter((_, valueIndex) => valueIndex !== index);
    onChange(nextValues);
    onColumnsChange(Math.max(nextValues.length, 1));
  };

  const undoLastListWeight = () => {
    const nonEmptyValues = values.filter((value) => value.trim() !== "");
    if (nonEmptyValues.length === 0) {
      return;
    }

    const nextValues = nonEmptyValues.slice(0, -1);
    onChange(nextValues);
    onColumnsChange(Math.max(nextValues.length, 1));
  };

  const deleteTableCellValue = (row: number, column: number) => {
    const targetEntryIndex = column * safeRows + row;
    const orderedValues = gridValuesToEntryOrder(
      gridValues,
      safeRows,
      safeColumns,
    ).map((value) => sanitizeWeightValue(value).trim());

    if (!orderedValues[targetEntryIndex]) {
      return;
    }

    const deleteIndex = orderedValues
      .slice(0, targetEntryIndex)
      .filter((value) => value !== "").length;
    const compactValues = orderedValues.filter((value) => value !== "");
    compactValues.splice(deleteIndex, 1);
    onChange(entryOrderToGridValues(compactValues, safeRows, safeColumns));
  };

  const handleListEntryKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    addListWeight();
  };

  return (
    <section className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-slate-700">{label}</h3>
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
          {enteredCount}
        </span>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-2.5">
        <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-xs font-medium text-slate-700">
            {weightInputModeLabel}
          </span>
          <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={switchToListMode}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "single" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
            >
              {singleRowModeLabel}
            </button>
            <button
              type="button"
              onClick={switchToTableMode}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${mode === "table" ? "bg-emerald-600 text-white" : "text-slate-600"}`}
            >
              {tableModeLabel}
            </button>
          </div>
        </div>

        {mode === "table" ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">
                {rowsLabel}
              </span>
              <input
                type="number"
                min={MIN_GRID_SIZE}
                inputMode="numeric"
                value={rowsInputValue}
                onChange={handleRowsInputChange}
                onBlur={commitRowsInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitRowsInput();
                  }
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-slate-700">
                {columnsLabel}
              </span>
              <input
                type="number"
                min={MIN_GRID_SIZE}
                inputMode="numeric"
                value={columnsInputValue}
                onChange={handleColumnsInputChange}
                onBlur={commitColumnsInput}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    commitColumnsInput();
                  }
                }}
                className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
              />
            </label>

            <div className="flex items-end">
              <p className="text-xs font-medium text-slate-600">{gridHint}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <input
              inputMode="decimal"
              value={entryValue}
              onChange={(event) =>
                setEntryValue(sanitizeWeightValue(event.target.value))
              }
              onKeyDown={handleListEntryKeyDown}
              placeholder="Enter weight (e.g. 58.9) and press Enter"
              className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
            />
            {values.filter((value) => value.trim() !== "").length > 0 ? (
              <div className="rounded-xl border border-slate-200 bg-white p-2.5">
                <div className="flex flex-wrap gap-2">
                  {values
                    .filter((value) => value.trim() !== "")
                    .map((value, index) => (
                      <span
                        key={`${value}-${index}`}
                        className="relative inline-flex items-center rounded-md bg-slate-100 px-3 py-1.5 pr-7 text-sm font-semibold text-slate-700"
                      >
                        {value}
                        <button
                          type="button"
                          onClick={() => deleteListWeight(index)}
                          className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700"
                          aria-label={`Remove weight ${value}`}
                        >
                          x
                        </button>
                      </span>
                    ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {mode === "table" ? (
        <div
          className={`rounded-2xl ${safeRows > GRID_SCROLL_ROW_THRESHOLD ? "max-h-screen overflow-y-auto pr-1" : ""}`}
        >
          <div className="space-y-2">
            {Array.from({ length: safeRows }, (_, row) => (
              <div key={`weight-row-${row}`} className="flex gap-2">
                {Array.from({ length: safeColumns }, (_, column) => {
                  const index = toCellIndex(row, column, safeColumns);

                  return (
                    <div
                      key={`weight-cell-${row}-${column}`}
                      className="relative min-w-0 flex-1"
                    >
                      <input
                        ref={(node) => {
                          inputRefs.current[index] = node;
                        }}
                        inputMode="decimal"
                        enterKeyHint="next"
                        value={gridValues[index] ?? ""}
                        onChange={(event) =>
                          updateCell(row, column, event.target.value)
                        }
                        onBlur={() => compactTableGrid()}
                        onKeyDown={(event) =>
                          handleCellKeyDown(event, row, column)
                        }
                        placeholder={`${row + 1}-${column + 1}`}
                        className={`h-11 w-full rounded-xl border border-slate-300 bg-white px-2 pr-6 text-center outline-none focus:border-emerald-500 ${safeColumns > GRID_SCROLL_COLUMN_THRESHOLD ? "text-[11px] sm:text-xs" : "text-sm"}`}
                      />
                      {(gridValues[index] ?? "").trim() !== "" ? (
                        <button
                          type="button"
                          onClick={() => deleteTableCellValue(row, column)}
                          className="absolute right-1 top-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-700"
                          aria-label={`Remove weight ${gridValues[index]}`}
                        >
                          x
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="flex gap-2">
        <Button onClick={clearWeights} variant="secondary" className="flex-1">
          {clearWeightsLabel}
        </Button>
        {mode === "single" ? (
          <Button
            onClick={undoLastListWeight}
            variant="secondary"
            className="flex-1"
            disabled={
              values.filter((value) => value.trim() !== "").length === 0
            }
          >
            {undoLastWeightLabel}
          </Button>
        ) : null}
      </div>

      <div className="space-y-1">
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

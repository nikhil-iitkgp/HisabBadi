import {
  formatReceiptDate,
  formatCurrency,
  formatNumber,
  getReceiptWeightGrid,
} from "@/utils/calculations";
import BrandLogo from "./BrandLogo";
import { Labels, ReceiptData } from "@/utils/types";

interface ReceiptProps {
  labels: Labels;
  receipt: ReceiptData;
  compactPrintMode?: boolean;
  exportMode?: boolean;
}

const GRID_SCROLL_COLUMN_THRESHOLD = 10;
const GRID_SCROLL_ROW_THRESHOLD = 20;
const WRAP_COLUMNS_PER_BLOCK = 8;
const GRID_COLUMNS_CLASS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-4",
  5: "grid-cols-5",
  6: "grid-cols-6",
  7: "grid-cols-7",
  8: "grid-cols-8",
};

const rowClass =
  "grid grid-cols-[1fr_auto] items-start gap-4 py-1.5 text-sm text-slate-700 sm:text-[15px]";

export default function Receipt({
  labels,
  receipt,
  compactPrintMode = false,
  exportMode = false,
}: ReceiptProps) {
  const weightGrid = getReceiptWeightGrid(receipt);
  const showTableWeights = receipt.weightInputMode === "table";
  const shouldWrapWeights = exportMode;
  const shouldStretchColumns = weightGrid.columns <= WRAP_COLUMNS_PER_BLOCK;
  const stretchGridClass =
    GRID_COLUMNS_CLASS[weightGrid.columns] ?? "grid-cols-1";
  const weightColumnBlocks = Array.from(
    {
      length: Math.max(
        1,
        Math.ceil(weightGrid.columns / WRAP_COLUMNS_PER_BLOCK),
      ),
    },
    (_, blockIndex) => {
      const start = blockIndex * WRAP_COLUMNS_PER_BLOCK;
      const end = Math.min(weightGrid.columns, start + WRAP_COLUMNS_PER_BLOCK);
      return { start, end, index: blockIndex };
    },
  );

  return (
    <article
      className={`receipt-sheet rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 sm:p-6 ${compactPrintMode ? "receipt-compact-print" : ""}`}
    >
      <header className="mb-4 border-b border-slate-100 pb-3 sm:mb-5">
        <div className="flex items-start justify-between gap-3">
          <BrandLogo size="sm" />
          <h2 className="text-right text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            RECEIPT
          </h2>
        </div>
      </header>

      <section className="space-y-0.5 border-b border-slate-200 pb-3">
        <div className={rowClass}>
          <span className="font-semibold">{labels.date}</span>
          <span className="text-right">{formatReceiptDate(receipt.date)}</span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.buyer}</span>
          <span className="text-right">{receipt.buyerName}</span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.seller}</span>
          <span className="text-right">{receipt.sellerName}</span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.grain}</span>
          <span className="text-right font-bold text-blue-600">
            {receipt.grainName}
          </span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.rate}</span>
          <span className="text-right">
            {formatCurrency(receipt.ratePerKg)} / Kg
          </span>
        </div>
      </section>

      <section className="space-y-0.5 border-b border-slate-200 py-3">
        <div className={rowClass}>
          <span className="font-semibold">{labels.bori}</span>
          <span className="text-right">{receipt.boriCount}</span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.reduction}</span>
          <span className="text-right">
            {formatNumber(receipt.reductionPerBori)} Kg/b
          </span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.palledari}</span>
          <span className="text-right">
            {formatCurrency(receipt.palledariPerBori)} /b
          </span>
        </div>
        {receipt.totalCommission ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.commission}</span>
            <span className="text-right">
              {formatCurrency(receipt.totalCommission)}
            </span>
          </div>
        ) : null}
        {receipt.tags?.length ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.receiptTags}</span>
            <span className="text-right">{receipt.tags.join(", ")}</span>
          </div>
        ) : null}
        {receipt.truckNumber ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.truckNumber}</span>
            <span className="text-right">{receipt.truckNumber}</span>
          </div>
        ) : null}
        {receipt.qualityNote ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.quality}</span>
            <span className="text-right">{receipt.qualityNote}</span>
          </div>
        ) : null}
        {receipt.moistureNote ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.moisture}</span>
            <span className="text-right">{receipt.moistureNote}</span>
          </div>
        ) : null}
        {receipt.brokerName ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.brokerName}</span>
            <span className="text-right">{receipt.brokerName}</span>
          </div>
        ) : null}
      </section>

      <section className="space-y-2 border-b border-slate-200 py-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800">
            {labels.weights}:
          </h3>
          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
            {weightGrid.rows} × {weightGrid.columns}
          </span>
        </div>
        {showTableWeights ? (
          shouldWrapWeights ? (
            <div className="space-y-3">
              {weightColumnBlocks.map((block) => (
                <div
                  key={`receipt-block-${block.start}`}
                  className={`space-y-1.5 ${block.index > 0 ? "border-t border-dashed border-slate-200 pt-2" : ""}`}
                >
                  <div
                    className={`text-[10px] font-semibold text-slate-400 ${shouldStretchColumns ? `grid gap-1.5 ${stretchGridClass}` : "flex gap-1.5"}`}
                  >
                    {Array.from(
                      { length: block.end - block.start },
                      (_, offset) => (
                        <span
                          key={`receipt-col-label-${block.start + offset}`}
                          className={
                            shouldStretchColumns
                              ? "min-w-[64px] flex-1 text-center"
                              : "w-16 shrink-0 text-center"
                          }
                        >
                          Col {block.start + offset + 1}
                        </span>
                      ),
                    )}
                  </div>
                  {Array.from({ length: weightGrid.rows }, (_, row) => (
                    <div
                      key={`receipt-row-${block.start}-${row}`}
                      className={
                        shouldStretchColumns
                          ? `grid gap-1.5 ${stretchGridClass}`
                          : "flex gap-1.5"
                      }
                    >
                      {Array.from(
                        { length: block.end - block.start },
                        (_, offset) => {
                          const column = block.start + offset;
                          const index = row * weightGrid.columns + column;
                          const value = weightGrid.values[index] ?? "";

                          return (
                            <div
                              key={`receipt-weight-${index}`}
                              className={`min-h-9 ${
                                shouldStretchColumns
                                  ? "w-full"
                                  : "w-16 shrink-0"
                              } rounded-lg border border-slate-200 px-1.5 py-1.5 text-center font-semibold text-slate-700 ${weightGrid.columns > GRID_SCROLL_COLUMN_THRESHOLD ? "text-[10px] sm:text-[11px]" : "text-xs"} ${value.trim() ? "bg-slate-50" : "bg-slate-50/40 text-slate-300"}`}
                            >
                              {value || "-"}
                            </div>
                          );
                        },
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div
              className={`receipt-weight-grid-shell weight-grid-scroll w-full min-w-0 rounded-2xl ${weightGrid.rows > GRID_SCROLL_ROW_THRESHOLD ? "max-h-screen overflow-y-auto pr-1" : ""} ${shouldStretchColumns ? "overflow-x-hidden" : "overflow-x-auto"}`}
            >
              <div
                className={`space-y-1.5 ${shouldStretchColumns ? "w-full" : "w-max"}`}
              >
                {Array.from({ length: weightGrid.rows }, (_, row) => (
                  <div
                    key={`receipt-row-${row}`}
                    className={
                      shouldStretchColumns
                        ? `grid gap-1.5 ${stretchGridClass}`
                        : "flex gap-1.5"
                    }
                  >
                    {Array.from({ length: weightGrid.columns }, (_, column) => {
                      const index = row * weightGrid.columns + column;
                      const value = weightGrid.values[index] ?? "";

                      return (
                        <div
                          key={`receipt-weight-${index}`}
                          className={`min-h-9 ${
                            shouldStretchColumns ? "w-full" : "w-16 shrink-0"
                          } rounded-lg border border-slate-200 px-1.5 py-1.5 text-center font-semibold text-slate-700 ${weightGrid.columns > GRID_SCROLL_COLUMN_THRESHOLD ? "text-[10px] sm:text-[11px]" : "text-xs"} ${value.trim() ? "bg-slate-50" : "bg-slate-50/40 text-slate-300"}`}
                        >
                          {value || "-"}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        ) : (
          <p
            className={`rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 ${compactPrintMode ? "leading-4" : "leading-6"}`}
          >
            {weightGrid.values.filter((value) => value.trim() !== "").join(" ")}
          </p>
        )}
      </section>

      <section className="space-y-0.5 border-b border-slate-200 py-3">
        <div className={rowClass}>
          <span className="font-semibold">{labels.totalWeight}</span>
          <span className="text-right">
            {formatNumber(receipt.totalWeight)} Kg
          </span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.reducedWeight}</span>
          <span className="text-right">
            {receipt.boriCount} × {formatNumber(receipt.reductionPerBori)} ={" "}
            {formatNumber(receipt.reducedWeight)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.netWeight}</span>
          <span className="text-right">
            {formatNumber(receipt.totalWeight)} -{" "}
            {formatNumber(receipt.reducedWeight)} ={" "}
            {formatNumber(receipt.netWeight)}
          </span>
        </div>
      </section>

      <section className="space-y-0.5 py-3">
        <div className={rowClass}>
          <span className="font-semibold">{labels.amount}</span>
          <span className="text-right">
            {formatNumber(receipt.netWeight)} ×{" "}
            {formatNumber(receipt.ratePerKg)} = {formatCurrency(receipt.amount)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.palledari}</span>
          <span className="text-right">
            {receipt.boriCount} × {formatNumber(receipt.palledariPerBori)} ={" "}
            {formatCurrency(receipt.totalPalledari)}
          </span>
        </div>
      </section>

      <div className="mt-2 rounded-2xl border-2 border-emerald-500 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3 text-center text-xl font-extrabold text-emerald-800">
        {labels.finalPayment}: {formatCurrency(receipt.finalPayment)}
      </div>
    </article>
  );
}

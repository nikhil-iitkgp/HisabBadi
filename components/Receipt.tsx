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
          <div
            className={`receipt-weight-grid-shell rounded-2xl ${!exportMode && weightGrid.rows > GRID_SCROLL_ROW_THRESHOLD ? "max-h-screen overflow-y-auto pr-1" : ""}`}
          >
            <div className="space-y-1.5">
              {Array.from({ length: weightGrid.rows }, (_, row) => (
                <div key={`receipt-row-${row}`} className="flex gap-1.5">
                  {Array.from({ length: weightGrid.columns }, (_, column) => {
                    const index = row * weightGrid.columns + column;
                    const value = weightGrid.values[index] ?? "";

                    return (
                      <div
                        key={`receipt-weight-${index}`}
                        className={`min-h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-1.5 py-1.5 text-center font-semibold text-slate-700 ${weightGrid.columns > GRID_SCROLL_COLUMN_THRESHOLD ? "text-[10px] sm:text-[11px]" : "text-xs"} ${value.trim() ? "bg-slate-50" : "bg-slate-50/40 text-slate-300"}`}
                      >
                        {value || "-"}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
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

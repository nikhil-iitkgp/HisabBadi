import {
  formatReceiptDate,
  formatCurrency,
  formatNumber,
  formatWeight,
} from "@/utils/calculations";
import BrandLogo from "./BrandLogo";
import { Labels, ReceiptData } from "@/utils/types";

interface ReceiptProps {
  labels: Labels;
  receipt: ReceiptData;
  compactPrintMode?: boolean;
}

const rowClass =
  "grid grid-cols-[1fr_auto] items-start gap-4 py-1.5 text-sm text-slate-700 sm:text-[15px]";

export default function Receipt({
  labels,
  receipt,
  compactPrintMode = false,
}: ReceiptProps) {
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
      </section>

      <section className="space-y-2 border-b border-slate-200 py-3">
        <h3 className="text-sm font-semibold text-slate-800">
          {labels.weights}:
        </h3>
        <p
          className={`text-xs wrap-break-word text-slate-700 ${compactPrintMode ? "leading-4" : "leading-6"}`}
        >
          {receipt.weights.map((weight) => formatWeight(weight)).join(" ")}
        </p>
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

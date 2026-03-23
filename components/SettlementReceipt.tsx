import { formatCurrency, formatReceiptDate } from "@/utils/calculations";
import { Labels, SettlementSummary } from "@/utils/types";
import BrandLogo from "./BrandLogo";

interface SettlementReceiptProps {
  labels: Labels;
  settlement: SettlementSummary;
  compactPrintMode?: boolean;
}

const rowClass =
  "grid grid-cols-[1fr_auto] items-start gap-4 py-1.5 text-sm text-slate-700 sm:text-[15px]";

export default function SettlementReceipt({
  labels,
  settlement,
  compactPrintMode = false,
}: SettlementReceiptProps) {
  const primaryLabel =
    settlement.perspective === "seller" ? labels.seller : labels.buyer;
  const groupLabel =
    settlement.perspective === "seller"
      ? labels.buyerWiseTotals
      : labels.sellerWiseTotals;

  return (
    <article
      className={`receipt-sheet rounded-3xl border border-slate-200/80 bg-white/95 p-4 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 sm:p-6 ${compactPrintMode ? "receipt-compact-print" : ""}`}
    >
      <header className="mb-4 border-b border-slate-100 pb-3 sm:mb-5">
        <div className="flex items-start justify-between gap-3">
          <BrandLogo size="sm" />
          <div className="text-right">
            <h2 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
              {labels.settlementTitle}
            </h2>
            <p className="text-[11px] font-semibold text-slate-500">
              {settlement.perspective === "seller"
                ? labels.settlementFromSeller
                : labels.settlementFromBuyer}
            </p>
          </div>
        </div>
      </header>

      <section className="space-y-0.5 border-b border-slate-200 pb-3">
        <div className={rowClass}>
          <span className="font-semibold">{labels.date}</span>
          <span className="text-right">
            {formatReceiptDate(settlement.date)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{primaryLabel}</span>
          <span className="text-right">{settlement.primaryPartyName}</span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.selectedReceiptsCount}</span>
          <span className="text-right">{settlement.selectedReceipts}</span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.grain}</span>
          <span className="text-right">
            {settlement.grainNames.join(", ") || "-"}
          </span>
        </div>
      </section>

      <section className="space-y-2 border-b border-slate-200 py-3">
        <h3 className="text-sm font-semibold text-slate-800">{groupLabel}</h3>
        <div className="space-y-1.5">
          {settlement.partyGroups.map((group) => (
            <div
              key={group.partyName}
              className="rounded-xl border border-slate-200 bg-slate-50/70 p-2"
            >
              <div className={rowClass}>
                <span className="font-semibold text-slate-800">
                  {group.partyName} ({group.receiptCount})
                </span>
                <span className="text-right font-bold text-emerald-700">
                  {formatCurrency(group.finalPayment)}
                </span>
              </div>
              <div className="space-y-1 border-t border-slate-200 pt-1">
                <p className="text-[11px] font-semibold text-slate-500">
                  {labels.grainWiseBreakdown}
                </p>
                {group.grains.map((grain) => (
                  <div
                    key={`${group.partyName}-${grain.grainName}-${grain.ratePerKg}`}
                    className={rowClass}
                  >
                    <span className="text-[13px] text-slate-700">
                      {grain.grainName} @ {formatCurrency(grain.ratePerKg)} (
                      {grain.receiptCount})
                    </span>
                    <span className="text-right text-[13px] font-semibold text-slate-700">
                      {formatCurrency(grain.finalPayment)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-0.5 py-3">
        <div className={rowClass}>
          <span className="font-semibold">{labels.amount}</span>
          <span className="text-right">
            {formatCurrency(settlement.totalAmount)}
          </span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.palledari}</span>
          <span className="text-right">
            {formatCurrency(settlement.totalPalledari)}
          </span>
        </div>
      </section>

      <div className="mt-2 rounded-2xl border-2 border-emerald-500 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3 text-center text-xl font-extrabold text-emerald-800">
        {labels.finalCollection}: {formatCurrency(settlement.finalCollection)}
      </div>
    </article>
  );
}

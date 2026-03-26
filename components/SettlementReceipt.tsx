import {
  formatCurrency,
  formatNumber,
  formatReceiptDate,
  getReceiptWeightGrid,
} from "@/utils/calculations";
import { Labels, SettlementSummary } from "@/utils/types";
import BrandLogo from "./BrandLogo";

interface SettlementReceiptProps {
  labels: Labels;
  settlement: SettlementSummary;
  compactPrintMode?: boolean;
  exportMode?: boolean;
  showWeights?: boolean;
}

const rowClass =
  "grid grid-cols-[1fr_auto] items-start gap-4 py-1.5 text-sm text-slate-700 sm:text-[15px]";
const GRID_SCROLL_COLUMN_THRESHOLD = 10;
const GRID_SCROLL_ROW_THRESHOLD = 20;

export default function SettlementReceipt({
  labels,
  settlement,
  compactPrintMode = false,
  exportMode = false,
  showWeights = false,
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
              {settlement.title || labels.settlementTitle}
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
        {settlement.note ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.settlementNote}</span>
            <span className="text-right">{settlement.note}</span>
          </div>
        ) : null}
      </section>

      <section className="space-y-3 border-b border-slate-200 py-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-800">{groupLabel}</h3>
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
            {settlement.partyGroups.length}
          </span>
        </div>

        <div className="space-y-3">
          {settlement.partyGroups.map((group) => {
            const partyReceipts = settlement.receipts.filter((receipt) =>
              settlement.perspective === "seller"
                ? receipt.buyerName.trim() === group.partyName
                : receipt.sellerName.trim() === group.partyName,
            );

            return (
              <section
                key={group.partyName}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
              >
                <div
                  className={`flex flex-col gap-2 border-b border-slate-200 bg-slate-50/80 px-3 sm:flex-row sm:items-center sm:justify-between ${compactPrintMode ? "py-2" : "py-3"}`}
                >
                  <div>
                    <p className="text-base font-bold text-slate-900">
                      {group.partyName}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      {labels.selectedReceiptsCount}: {partyReceipts.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-700">
                    {formatCurrency(group.finalPayment)}
                  </div>
                </div>

                <div
                  className={`space-y-3 ${compactPrintMode ? "p-2.5" : "p-3"}`}
                >
                  {partyReceipts.map((receipt, receiptIndex) => {
                    const grid = getReceiptWeightGrid(receipt);
                    const showTableWeights =
                      receipt.weightInputMode === "table";

                    return (
                      <article
                        key={`${group.partyName}-${receipt.grainName}-${receipt.date}-${receiptIndex}`}
                        className={`rounded-2xl border border-slate-200 bg-slate-50/70 ${compactPrintMode ? "p-2.5" : "p-3"}`}
                      >
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-800">
                              {receipt.grainName}
                            </p>
                            <p className="text-xs font-medium text-slate-500">
                              {labels.date}: {formatReceiptDate(receipt.date)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 text-sm font-bold text-slate-800 shadow-sm ring-1 ring-slate-200">
                            {formatCurrency(receipt.finalPayment)}
                          </div>
                        </div>

                        <div
                          className={`mt-3 grid text-xs sm:grid-cols-2 ${compactPrintMode ? "gap-1.5" : "gap-2"}`}
                        >
                          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-500">
                              {labels.rate}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatCurrency(receipt.ratePerKg)} / Kg
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-500">
                              {labels.bori}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {receipt.boriCount}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-500">
                              {labels.totalWeight}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatNumber(receipt.totalWeight)} Kg
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-500">
                              {labels.reduction}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatNumber(receipt.reductionPerBori)} Kg / bori
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-500">
                              {labels.reducedWeight}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatNumber(receipt.reducedWeight)} Kg
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-500">
                              {labels.netWeight}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatNumber(receipt.netWeight)} Kg
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-500">
                              {labels.amount}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatCurrency(receipt.amount)}
                            </p>
                          </div>
                          <div className="rounded-xl bg-white px-3 py-2 ring-1 ring-slate-200">
                            <p className="font-semibold text-slate-500">
                              {labels.palledari}
                            </p>
                            <p className="mt-1 text-sm font-bold text-slate-800">
                              {formatCurrency(receipt.palledariPerBori)} / bori
                              | {formatCurrency(receipt.totalPalledari)}
                            </p>
                          </div>
                        </div>

                        {showWeights ? (
                          <div className="mt-3 rounded-xl bg-white px-3 py-3 ring-1 ring-slate-200">
                            <div className="mb-2 flex items-center justify-between gap-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {labels.weights}
                              </p>
                              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                                {receipt.weightDisplayValues?.filter(
                                  (value) => value.trim() !== "",
                                ).length ?? receipt.weights.length}
                              </span>
                            </div>
                            {showTableWeights ? (
                              <div
                                className={`receipt-weight-grid-shell rounded-xl ${!exportMode && grid.rows > GRID_SCROLL_ROW_THRESHOLD ? "max-h-screen overflow-y-auto pr-1" : ""}`}
                              >
                                <div className="space-y-1.5">
                                  {Array.from(
                                    { length: grid.rows },
                                    (_, row) => (
                                      <div
                                        key={`settlement-weight-row-${receiptIndex}-${row}`}
                                        className="flex gap-1.5"
                                      >
                                        {Array.from(
                                          { length: grid.columns },
                                          (_, column) => {
                                            const index =
                                              row * grid.columns + column;
                                            const value =
                                              grid.values[index] ?? "";

                                            return (
                                              <div
                                                key={`settlement-weight-${receiptIndex}-${index}`}
                                                className={`min-h-8 min-w-0 flex-1 rounded-md border border-slate-200 px-1.5 py-1 text-center font-semibold ${grid.columns > GRID_SCROLL_COLUMN_THRESHOLD ? "text-[10px]" : "text-[11px]"} ${value.trim() ? "bg-white text-slate-700" : "bg-white/60 text-slate-300"}`}
                                              >
                                                {value || "-"}
                                              </div>
                                            );
                                          },
                                        )}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700">
                                {grid.values
                                  .filter((value) => value.trim() !== "")
                                  .join(" ")}
                              </p>
                            )}
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="space-y-0.5 py-3">
        <div className={rowClass}>
          <span className="font-semibold">{labels.totalWeight}</span>
          <span className="text-right">
            {formatNumber(settlement.totalWeight)} Kg
          </span>
        </div>
        <div className={rowClass}>
          <span className="font-semibold">{labels.netWeight}</span>
          <span className="text-right">
            {formatNumber(settlement.totalNetWeight)} Kg
          </span>
        </div>
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
        {settlement.totalCommission ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.commission}</span>
            <span className="text-right">
              {formatCurrency(settlement.totalCommission)}
            </span>
          </div>
        ) : null}
        {settlement.previousBalance ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.previousBalance}</span>
            <span className="text-right">
              {formatCurrency(settlement.previousBalance)}
            </span>
          </div>
        ) : null}
        {settlement.cashPaid ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.cashPaid}</span>
            <span className="text-right">
              {formatCurrency(settlement.cashPaid)}
            </span>
          </div>
        ) : null}
        {settlement.roundingAdjustment ? (
          <div className={rowClass}>
            <span className="font-semibold">{labels.roundingAdjustment}</span>
            <span className="text-right">
              {formatCurrency(settlement.roundingAdjustment)}
            </span>
          </div>
        ) : null}
      </section>

      <div className="mt-2 rounded-2xl border-2 border-emerald-500 bg-linear-to-r from-emerald-50 to-teal-50 px-4 py-3 text-center text-xl font-extrabold text-emerald-800">
        {labels.finalCollection}: {formatCurrency(settlement.finalCollection)}
      </div>
    </article>
  );
}

"use client";

import { toPng } from "html-to-image";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useRef, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import Button from "@/components/Button";
import Receipt from "@/components/Receipt";
import SettlementReceipt from "@/components/SettlementReceipt";
import {
  buildReceiptSummaryText,
  buildSettlementSummaryText,
  computeSettlementSummary,
  formatCurrency,
} from "@/utils/calculations";
import {
  LANGUAGE_LABELS,
  Language,
  ReceiptData,
  SettlementPerspective,
  SettlementSummary,
} from "@/utils/types";

type ToastState = {
  message: string;
  tone: "success" | "error" | "info";
} | null;

type ReceiptHistoryItem = {
  id: string;
  createdAt: number;
  receipt: ReceiptData;
};

type ActionKey =
  | "printPdf"
  | "edit"
  | "copy"
  | "whatsapp"
  | "whatsappPng"
  | "downloadPng";
type ActionStatus = "idle" | "loading" | "success";

const RECEIPT_HISTORY_KEY = "hisabbadi:receiptHistory";
const Form = dynamic(() => import("@/components/Form"), { ssr: false });

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const [receipt, setReceipt] = useState<ReceiptData | null>(null);
  const [settlement, setSettlement] = useState<SettlementSummary | null>(null);
  const [settlementPerspective, setSettlementPerspective] =
    useState<SettlementPerspective>("seller");
  const [activeOutput, setActiveOutput] = useState<
    "receipt" | "settlement" | null
  >(null);
  const [compactPrintMode, setCompactPrintMode] = useState(false);
  const [isProcessingPng, setIsProcessingPng] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [receiptHistory, setReceiptHistory] = useState<ReceiptHistoryItem[]>(
    [],
  );
  const [historySearch, setHistorySearch] = useState("");
  const [selectedSettlementSeller, setSelectedSettlementSeller] = useState("");
  const [selectedSettlementBuyer, setSelectedSettlementBuyer] = useState("");
  const [selectedSettlementIds, setSelectedSettlementIds] = useState<string[]>(
    [],
  );
  const [actionStatus, setActionStatus] = useState<
    Record<ActionKey, ActionStatus>
  >({
    printPdf: "idle",
    edit: "idle",
    copy: "idle",
    whatsapp: "idle",
    whatsappPng: "idle",
    downloadPng: "idle",
  });
  const receiptCardRef = useRef<HTMLDivElement | null>(null);
  const receiptSectionRef = useRef<HTMLElement | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const labels = useMemo(() => LANGUAGE_LABELS[language], [language]);
  const filteredHistory = useMemo(() => {
    const query = historySearch.trim().toLowerCase();
    if (!query) {
      return receiptHistory;
    }

    return receiptHistory.filter((item) => {
      const haystack = [
        item.receipt.buyerName,
        item.receipt.sellerName,
        item.receipt.grainName,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [historySearch, receiptHistory]);

  const uniqueSellers = useMemo(
    () =>
      Array.from(
        new Set(
          receiptHistory
            .map((item) => item.receipt.sellerName.trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [receiptHistory],
  );

  const uniqueBuyers = useMemo(
    () =>
      Array.from(
        new Set(
          receiptHistory
            .map((item) => item.receipt.buyerName.trim())
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right)),
    [receiptHistory],
  );

  const selectedSettlementParty =
    settlementPerspective === "seller"
      ? selectedSettlementSeller
      : selectedSettlementBuyer;

  const selectedSettlementReceipts = useMemo(
    () =>
      receiptHistory
        .filter(
          (item) =>
            selectedSettlementIds.includes(item.id) &&
            (settlementPerspective === "seller"
              ? item.receipt.sellerName.trim() ===
                selectedSettlementSeller.trim()
              : item.receipt.buyerName.trim() ===
                selectedSettlementBuyer.trim()),
        )
        .map((item) => item.receipt),
    [
      receiptHistory,
      selectedSettlementIds,
      selectedSettlementSeller,
      selectedSettlementBuyer,
      settlementPerspective,
    ],
  );

  const selectableSellerReceiptIds = useMemo(
    () =>
      receiptHistory
        .filter((item) => {
          if (settlementPerspective === "seller") {
            return (
              item.receipt.sellerName.trim() === selectedSettlementSeller.trim()
            );
          }
          return (
            item.receipt.buyerName.trim() === selectedSettlementBuyer.trim()
          );
        })
        .map((item) => item.id),
    [
      receiptHistory,
      selectedSettlementSeller,
      selectedSettlementBuyer,
      settlementPerspective,
    ],
  );

  const latestSelectableSellerReceiptIds = useMemo(
    () =>
      receiptHistory
        .filter((item) => {
          if (settlementPerspective === "seller") {
            return (
              item.receipt.sellerName.trim() === selectedSettlementSeller.trim()
            );
          }
          return (
            item.receipt.buyerName.trim() === selectedSettlementBuyer.trim()
          );
        })
        .sort((left, right) => right.createdAt - left.createdAt)
        .map((item) => item.id),
    [
      receiptHistory,
      selectedSettlementSeller,
      selectedSettlementBuyer,
      settlementPerspective,
    ],
  );

  const selectedSettlementCounterpartyCount = useMemo(
    () =>
      new Set(
        selectedSettlementReceipts.map((receipt) =>
          settlementPerspective === "seller"
            ? receipt.buyerName.trim()
            : receipt.sellerName.trim(),
        ),
      ).size,
    [selectedSettlementReceipts, settlementPerspective],
  );

  const selectedSettlementCollection = useMemo(
    () =>
      selectedSettlementReceipts.reduce(
        (sum, receipt) => sum + receipt.finalPayment,
        0,
      ),
    [selectedSettlementReceipts],
  );

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.body.classList.toggle("compact-print-mode", compactPrintMode);
    return () => {
      document.body.classList.remove("compact-print-mode");
    };
  }, [compactPrintMode]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const historyRaw = window.localStorage.getItem(RECEIPT_HISTORY_KEY);
    if (historyRaw) {
      try {
        const parsed = JSON.parse(historyRaw) as ReceiptHistoryItem[];
        setReceiptHistory(Array.isArray(parsed) ? parsed : []);
      } catch {
        window.localStorage.removeItem(RECEIPT_HISTORY_KEY);
      }
    }

    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
        toastTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      RECEIPT_HISTORY_KEY,
      JSON.stringify(receiptHistory),
    );
  }, [receiptHistory]);

  const showToast = (
    message: string,
    tone: "success" | "error" | "info" = "info",
  ) => {
    setToast({ message, tone });
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2200);
  };

  const markAction = (key: ActionKey, status: ActionStatus) => {
    setActionStatus((prev) => ({ ...prev, [key]: status }));
    if (status === "success") {
      setTimeout(() => {
        setActionStatus((prev) => ({ ...prev, [key]: "idle" }));
      }, 1000);
    }
  };

  const actionLabel = (
    key: ActionKey,
    label: string,
    loadingText = "Working...",
  ) => {
    const status = actionStatus[key];
    const icon = status === "loading" ? "⏳" : status === "success" ? "✓" : "";
    const text = status === "loading" ? loadingText : label;

    return (
      <span className="inline-flex items-center gap-1.5">
        {icon ? <span aria-hidden>{icon}</span> : null}
        <span>{text}</span>
      </span>
    );
  };

  const handleGenerateReceipt = (data: ReceiptData) => {
    setReceipt(data);
    setSettlement(null);
    setActiveOutput("receipt");

    const historyItem: ReceiptHistoryItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      createdAt: Date.now(),
      receipt: data,
    };

    setReceiptHistory((prev) => [historyItem, ...prev]);
    showToast("Receipt generated", "success");
    setTimeout(() => {
      receiptSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const handleResetReceipt = () => {
    setReceipt(null);
    setSettlement(null);
    setActiveOutput(null);
    markAction("edit", "success");
    showToast("Editing mode enabled", "info");
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      markAction("printPdf", "success");
      window.print();
      showToast("Print dialog opened", "info");
    }
  };

  const copyReceiptSummary = async () => {
    if (typeof navigator === "undefined" || !navigator.clipboard) {
      showToast("Clipboard not supported", "error");
      return;
    }

    const currentReceipt = activeOutput === "receipt" ? receipt : null;
    const currentSettlement = activeOutput === "settlement" ? settlement : null;
    if (!currentReceipt && !currentSettlement) {
      showToast("Generate a receipt first", "error");
      return;
    }

    try {
      markAction("copy", "loading");
      const summary = currentSettlement
        ? buildSettlementSummaryText(currentSettlement, labels)
        : buildReceiptSummaryText(currentReceipt!, labels);
      await navigator.clipboard.writeText(summary);
      markAction("copy", "success");
      showToast("Summary copied", "success");
    } catch {
      markAction("copy", "idle");
      showToast("Copy failed", "error");
    }
  };

  const openWhatsAppText = () => {
    const currentReceipt = activeOutput === "receipt" ? receipt : null;
    const currentSettlement = activeOutput === "settlement" ? settlement : null;

    if (
      (!currentReceipt && !currentSettlement) ||
      typeof window === "undefined"
    ) {
      showToast("Generate a receipt first", "error");
      return;
    }

    const summary = currentSettlement
      ? buildSettlementSummaryText(currentSettlement, labels)
      : buildReceiptSummaryText(currentReceipt!, labels);
    const encoded = encodeURIComponent(summary);
    window.open(
      `https://wa.me/?text=${encoded}`,
      "_blank",
      "noopener,noreferrer",
    );
    markAction("whatsapp", "success");
    showToast("WhatsApp text opened", "success");
  };

  const captureReceiptPng = async (): Promise<{
    dataUrl: string;
    file: File;
  }> => {
    if (!receiptCardRef.current) {
      throw new Error("Receipt unavailable");
    }

    if (typeof document !== "undefined" && "fonts" in document) {
      await document.fonts.ready;
    }

    const dataUrl = await toPng(receiptCardRef.current, {
      cacheBust: true,
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });

    const response = await fetch(dataUrl);
    const blob = await response.blob();
    const file = new File([blob], "hisabbadi-receipt.png", {
      type: "image/png",
    });

    return { dataUrl, file };
  };

  const downloadReceiptAsPng = async () => {
    if (!receiptCardRef.current || typeof window === "undefined") {
      showToast("Generate a receipt first", "error");
      return;
    }

    try {
      setIsProcessingPng(true);
      markAction("downloadPng", "loading");
      const { dataUrl } = await captureReceiptPng();

      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = "hisabbadi-receipt.png";
      anchor.click();
      markAction("downloadPng", "success");
      showToast("Image downloaded", "success");
    } catch {
      markAction("downloadPng", "idle");
      showToast("PNG download failed", "error");
    } finally {
      setIsProcessingPng(false);
    }
  };

  const openWhatsAppWithPng = async () => {
    const currentReceipt = activeOutput === "receipt" ? receipt : null;
    const currentSettlement = activeOutput === "settlement" ? settlement : null;

    if (
      !receiptCardRef.current ||
      (!currentReceipt && !currentSettlement) ||
      typeof window === "undefined"
    ) {
      showToast("Generate a receipt first", "error");
      return;
    }

    try {
      setIsProcessingPng(true);
      markAction("whatsappPng", "loading");
      const { dataUrl } = await captureReceiptPng();

      const caption = currentSettlement
        ? [
            `${currentSettlement.perspective === "seller" ? labels.seller : labels.buyer}: ${currentSettlement.primaryPartyName}`,
            `${labels.selectedReceiptsCount}: ${currentSettlement.selectedReceipts}`,
            `${labels.finalCollection}: ${formatCurrency(currentSettlement.finalCollection)}`,
          ].join("\n")
        : [
            `${labels.buyer}: ${currentReceipt!.buyerName}`,
            `${labels.seller}: ${currentReceipt!.sellerName}`,
            `${labels.finalPayment}: ${formatCurrency(currentReceipt!.finalPayment)}`,
          ].join("\n");

      let isCaptionCopied = false;
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(caption);
          isCaptionCopied = true;
        } catch {
          isCaptionCopied = false;
        }
      }

      const anchor = document.createElement("a");
      anchor.href = dataUrl;
      anchor.download = "hisabbadi-receipt.png";
      anchor.click();

      const message = encodeURIComponent(
        isCaptionCopied
          ? "Receipt PNG downloaded. Please attach as photo: hisabbadi-receipt.png (not as document).\n(Caption copied to clipboard. Paste it in chat.)"
          : `Receipt PNG downloaded. Please attach as photo: hisabbadi-receipt.png (not as document).\n\n${caption}`,
      );
      window.open(
        `https://wa.me/?text=${message}`,
        "_blank",
        "noopener,noreferrer",
      );

      markAction("whatsappPng", "success");
      showToast(
        isCaptionCopied
          ? "WhatsApp opened. PNG downloaded and caption copied."
          : "WhatsApp opened. PNG downloaded (caption in message).",
        "success",
      );
    } catch {
      markAction("whatsappPng", "idle");
      showToast("Unable to prepare WhatsApp PNG", "error");
    } finally {
      setIsProcessingPng(false);
    }
  };

  const loadFromHistory = (item: ReceiptHistoryItem) => {
    setReceipt(item.receipt);
    setSettlement(null);
    setActiveOutput("receipt");
    showToast("Loaded from history", "success");
    setTimeout(() => {
      receiptSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const clearHistory = () => {
    setReceiptHistory([]);
    setSelectedSettlementIds([]);
    setSettlement(null);
    setSelectedSettlementSeller("");
    setSelectedSettlementBuyer("");
    if (activeOutput === "settlement") {
      setActiveOutput(null);
    }
    showToast("History cleared", "info");
  };

  const handleSettlementPerspectiveChange = (
    nextPerspective: SettlementPerspective,
  ) => {
    setSettlementPerspective(nextPerspective);
    setSelectedSettlementIds([]);
    setSettlement(null);
    setSelectedSettlementSeller("");
    setSelectedSettlementBuyer("");
  };

  const handleSettlementSellerChange = (value: string) => {
    setSelectedSettlementSeller(value);
    setSelectedSettlementBuyer("");
    setSelectedSettlementIds([]);
    setSettlement(null);
  };

  const handleSettlementBuyerChange = (value: string) => {
    setSelectedSettlementBuyer(value);
    setSelectedSettlementSeller("");
    setSelectedSettlementIds([]);
    setSettlement(null);
  };

  const toggleSettlementReceipt = (item: ReceiptHistoryItem) => {
    const canSelect =
      settlementPerspective === "seller"
        ? item.receipt.sellerName.trim() === selectedSettlementSeller.trim()
        : item.receipt.buyerName.trim() === selectedSettlementBuyer.trim();

    if (!canSelect) {
      return;
    }

    setSelectedSettlementIds((prev) =>
      prev.includes(item.id)
        ? prev.filter((existingId) => existingId !== item.id)
        : [...prev, item.id],
    );
    setSettlement(null);
  };

  const selectAllForSeller = () => {
    if (!selectedSettlementParty.trim()) {
      showToast(
        settlementPerspective === "seller"
          ? labels.selectSeller
          : labels.selectBuyer,
        "info",
      );
      return;
    }

    setSelectedSettlementIds(selectableSellerReceiptIds);
    setSettlement(null);
  };

  const clearSettlementSelection = () => {
    setSelectedSettlementIds([]);
    setSettlement(null);
  };

  const selectLatestForSeller = (count: number) => {
    if (!selectedSettlementParty.trim()) {
      showToast(
        settlementPerspective === "seller"
          ? labels.selectSeller
          : labels.selectBuyer,
        "info",
      );
      return;
    }

    const nextSelection = latestSelectableSellerReceiptIds.slice(0, count);
    setSelectedSettlementIds(nextSelection);
    setSettlement(null);
  };

  const generateSettlementReceipt = () => {
    if (!selectedSettlementParty.trim()) {
      showToast(
        settlementPerspective === "seller"
          ? labels.selectSeller
          : labels.selectBuyer,
        "info",
      );
      return;
    }

    if (selectedSettlementReceipts.length === 0) {
      showToast(labels.noSettlementReceipts, "error");
      return;
    }

    const nextSettlement = computeSettlementSummary(
      selectedSettlementReceipts,
      settlementPerspective,
      selectedSettlementParty,
    );

    setReceipt(null);
    setSettlement(nextSettlement);
    setActiveOutput("settlement");
    showToast("Final settlement generated", "success");
    setTimeout(() => {
      receiptSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  };

  const exportHistoryCsv = () => {
    if (receiptHistory.length === 0 || typeof window === "undefined") {
      showToast("No history to export", "info");
      return;
    }

    const header = [
      "CreatedAt",
      "Date",
      "Buyer",
      "Seller",
      "Grain",
      "Bori",
      "TotalWeight",
      "ReducedWeight",
      "NetWeight",
      "Amount",
      "TotalPalledari",
      "FinalPayment",
    ];

    const quote = (value: string | number) =>
      `"${String(value).replaceAll('"', '""')}"`;

    const rows = receiptHistory.map((item) => [
      new Date(item.createdAt).toISOString(),
      item.receipt.date,
      item.receipt.buyerName,
      item.receipt.sellerName,
      item.receipt.grainName,
      item.receipt.boriCount,
      item.receipt.totalWeight.toFixed(2),
      item.receipt.reducedWeight.toFixed(2),
      item.receipt.netWeight.toFixed(2),
      item.receipt.amount.toFixed(2),
      item.receipt.totalPalledari.toFixed(2),
      item.receipt.finalPayment.toFixed(2),
    ]);

    const csv = [
      header.map(quote).join(","),
      ...rows.map((row) => row.map(quote).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "hisabbadi-receipt-history.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    showToast("History CSV exported", "success");
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-screen-2xl px-2 py-3 sm:px-4 sm:py-6 lg:px-6">
      <section className="no-print mb-3 rounded-3xl border border-slate-200/80 bg-white/95 p-2.5 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 sm:mb-4 sm:p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <BrandLogo size="lg" />
          </div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap lg:items-center lg:gap-3">
            <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:min-w-52">
              {labels.language}
              <select
                value={language}
                onChange={(event) =>
                  setLanguage(event.target.value as Language)
                }
                aria-label={labels.language}
                className="h-9 rounded-lg border border-slate-300 bg-white px-2 text-sm"
              >
                <option value="en">English</option>
                <option value="hi">Hinglish</option>
              </select>
            </label>

            <label className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 lg:min-w-52">
              {labels.compactPrintMode}
              <input
                type="checkbox"
                checked={compactPrintMode}
                onChange={(event) => setCompactPrintMode(event.target.checked)}
                aria-label={labels.compactPrintMode}
                className="h-4 w-4"
              />
            </label>
          </div>
        </div>
      </section>

      {receiptHistory.length > 0 ? (
        <section className="no-print mb-3 rounded-2xl border border-slate-200/80 bg-white/90 p-3 shadow-sm sm:mb-4">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-800">
              {labels.receiptHistory}
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportHistoryCsv}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                {labels.exportHistoryCsv}
              </button>
              <button
                type="button"
                onClick={clearHistory}
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                {labels.clearHistory}
              </button>
            </div>
          </div>
          <input
            value={historySearch}
            onChange={(event) => setHistorySearch(event.target.value)}
            placeholder={labels.historySearch}
            aria-label={labels.historySearch}
            className="mb-2 h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500"
          />
          <div className="mb-2 inline-flex rounded-xl border border-slate-200 bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => handleSettlementPerspectiveChange("seller")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                settlementPerspective === "seller"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600"
              }`}
            >
              {labels.settlementFromSeller}
            </button>
            <button
              type="button"
              onClick={() => handleSettlementPerspectiveChange("buyer")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${
                settlementPerspective === "buyer"
                  ? "bg-white text-emerald-700 shadow-sm"
                  : "text-slate-600"
              }`}
            >
              {labels.settlementFromBuyer}
            </button>
          </div>
          <div className="mb-2 grid gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2 sm:grid-cols-2 lg:grid-cols-5">
            <label className="flex items-center justify-between gap-2 rounded-lg bg-white px-2 py-2 text-xs font-semibold text-slate-700">
              {settlementPerspective === "seller"
                ? labels.selectSeller
                : labels.selectBuyer}
              <select
                value={
                  settlementPerspective === "seller"
                    ? selectedSettlementSeller
                    : selectedSettlementBuyer
                }
                onChange={(event) =>
                  settlementPerspective === "seller"
                    ? handleSettlementSellerChange(event.target.value)
                    : handleSettlementBuyerChange(event.target.value)
                }
                aria-label={
                  settlementPerspective === "seller"
                    ? labels.selectSeller
                    : labels.selectBuyer
                }
                className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
              >
                <option value="">
                  {settlementPerspective === "seller"
                    ? labels.selectSeller
                    : labels.selectBuyer}
                </option>
                {(settlementPerspective === "seller"
                  ? uniqueSellers
                  : uniqueBuyers
                ).map((partyName) => (
                  <option key={partyName} value={partyName}>
                    {partyName}
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-center justify-between rounded-lg bg-white px-2 py-2 text-xs font-semibold text-slate-700">
              <span>{labels.selectedReceiptsCount}</span>
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-emerald-700">
                {selectedSettlementReceipts.length}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white px-2 py-2 text-xs font-semibold text-slate-700">
              <span>
                {settlementPerspective === "seller"
                  ? labels.selectedBuyers
                  : labels.selectedSellers}
              </span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                {selectedSettlementCounterpartyCount}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-lg bg-white px-2 py-2 text-xs font-semibold text-slate-700">
              <span>{labels.finalCollection}</span>
              <span className="text-emerald-700">
                {formatCurrency(selectedSettlementCollection)}
              </span>
            </div>

            <Button
              variant="secondary"
              className="h-10 text-xs"
              onClick={selectAllForSeller}
              disabled={
                !selectedSettlementParty.trim() ||
                selectableSellerReceiptIds.length === 0
              }
            >
              {labels.selectAll}
            </Button>

            <Button
              variant="secondary"
              className="h-10 text-xs"
              onClick={() => selectLatestForSeller(3)}
              disabled={
                !selectedSettlementParty.trim() ||
                latestSelectableSellerReceiptIds.length === 0
              }
            >
              {labels.selectLatest3}
            </Button>

            <Button
              variant="secondary"
              className="h-10 text-xs"
              onClick={() => selectLatestForSeller(5)}
              disabled={
                !selectedSettlementParty.trim() ||
                latestSelectableSellerReceiptIds.length === 0
              }
            >
              {labels.selectLatest5}
            </Button>

            <Button
              variant="secondary"
              className="h-10 text-xs"
              onClick={clearSettlementSelection}
              disabled={selectedSettlementReceipts.length === 0}
            >
              {labels.unselectAll}
            </Button>

            <Button
              className="h-10 text-xs lg:col-span-2"
              onClick={generateSettlementReceipt}
              disabled={
                !selectedSettlementParty.trim() ||
                selectedSettlementReceipts.length === 0
              }
            >
              {labels.generateSettlement}
            </Button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {filteredHistory.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-2 ${
                  selectedSettlementParty.trim() &&
                  (settlementPerspective === "seller"
                    ? item.receipt.sellerName.trim() !==
                      selectedSettlementSeller.trim()
                    : item.receipt.buyerName.trim() !==
                      selectedSettlementBuyer.trim())
                    ? "border-slate-200/80 bg-slate-50/60 opacity-70"
                    : "border-slate-200 bg-white"
                }`}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <p className="truncate text-[10px] font-semibold text-slate-500">
                    {settlementPerspective === "seller"
                      ? item.receipt.sellerName
                      : item.receipt.buyerName}
                  </p>
                  {selectedSettlementParty.trim() &&
                  (settlementPerspective === "seller"
                    ? item.receipt.sellerName.trim() ===
                      selectedSettlementSeller.trim()
                    : item.receipt.buyerName.trim() ===
                      selectedSettlementBuyer.trim()) ? (
                    <label className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
                      <input
                        type="checkbox"
                        checked={selectedSettlementIds.includes(item.id)}
                        onChange={() => toggleSettlementReceipt(item)}
                        className="h-3.5 w-3.5"
                      />
                      Select
                    </label>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => loadFromHistory(item)}
                  className="w-full text-left"
                >
                  <p className="truncate text-xs font-bold text-slate-800">
                    {item.receipt.grainName}
                  </p>
                  <p className="truncate text-[11px] text-slate-600">
                    {settlementPerspective === "seller"
                      ? item.receipt.buyerName
                      : item.receipt.sellerName}
                  </p>
                  <p className="text-[11px] font-semibold text-emerald-700">
                    {formatCurrency(item.receipt.finalPayment)}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(item.createdAt).toLocaleString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                  <p className="mt-1 text-[10px] font-semibold text-emerald-700">
                    {labels.loadReceipt}
                  </p>
                </button>
              </div>
            ))}
          </div>
          {filteredHistory.length === 0 ? (
            <p className="mt-2 text-xs text-slate-500">
              No matching history items.
            </p>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-3 md:gap-4 xl:grid-cols-[1.2fr_1fr] xl:items-start">
        <section className="no-print rounded-3xl border border-slate-200/80 bg-white/95 p-3 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 sm:p-5">
          <Form labels={labels} onGenerate={handleGenerateReceipt} />
        </section>

        <section ref={receiptSectionRef} className="space-y-3">
          {(activeOutput === "receipt" && receipt) ||
          (activeOutput === "settlement" && settlement) ? (
            <>
              <div className="no-print grid grid-cols-2 gap-2 xl:sticky xl:top-3 xl:z-10">
                <Button onClick={handlePrint} className="sm:flex-1">
                  {actionLabel("printPdf", labels.printAsPdf)}
                </Button>
                <Button
                  variant="secondary"
                  onClick={downloadReceiptAsPng}
                  className="sm:flex-1"
                  disabled={isProcessingPng}
                >
                  {actionLabel(
                    "downloadPng",
                    labels.downloadPng,
                    "Preparing...",
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={openWhatsAppWithPng}
                  className="sm:flex-1"
                  disabled={isProcessingPng}
                >
                  {actionLabel(
                    "whatsappPng",
                    labels.whatsappPng,
                    "Preparing...",
                  )}
                </Button>
                <Button
                  variant="secondary"
                  onClick={openWhatsAppText}
                  className="sm:flex-1"
                >
                  {actionLabel("whatsapp", labels.whatsappText)}
                </Button>
                <Button
                  variant="secondary"
                  onClick={copyReceiptSummary}
                  className="sm:flex-1"
                >
                  {actionLabel("copy", labels.copySummary, "Copying...")}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleResetReceipt}
                  className="sm:flex-1"
                >
                  {actionLabel("edit", labels.editDetails)}
                </Button>
              </div>
              <div ref={receiptCardRef}>
                {activeOutput === "settlement" && settlement ? (
                  <SettlementReceipt
                    labels={labels}
                    settlement={settlement}
                    compactPrintMode={compactPrintMode}
                  />
                ) : receipt ? (
                  <Receipt
                    labels={labels}
                    receipt={receipt}
                    compactPrintMode={compactPrintMode}
                  />
                ) : null}
              </div>
            </>
          ) : (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-center text-sm text-slate-600">
              Fill details and tap{" "}
              <span className="font-semibold">{labels.generateReceipt}</span>.
            </div>
          )}
        </section>
      </div>

      {toast ? (
        <div
          className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-50 mx-auto flex w-full max-w-md justify-center px-3"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div
            className={`hs-toast pointer-events-auto w-full rounded-xl px-4 py-3 text-sm font-semibold shadow-xl ring-1 ${
              toast.tone === "success"
                ? "bg-emerald-600 text-white ring-emerald-500/40"
                : toast.tone === "error"
                  ? "bg-red-600 text-white ring-red-500/40"
                  : "bg-slate-800 text-white ring-slate-700/40"
            }`}
          >
            {toast.message}
          </div>
        </div>
      ) : null}
    </main>
  );
}

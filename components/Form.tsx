"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { computeReceipt } from "@/utils/calculations";
import {
  FieldErrorMap,
  Labels,
  ReceiptData,
  TransactionFormValues,
  getTodayDate,
} from "@/utils/types";
import Button from "./Button";
import WeightInput from "./WeightInput";

interface FormProps {
  labels: Labels;
  onGenerate: (receipt: ReceiptData) => void;
}

const DRAFT_KEY = "hisabbadi:receiptDraft";
const RECENT_BUYERS_KEY = "hisabbadi:recentBuyers";
const RECENT_SELLERS_KEY = "hisabbadi:recentSellers";
const RECENT_GRAINS_KEY = "hisabbadi:recentGrains";
const FAVORITE_BUYERS_KEY = "hisabbadi:favoriteBuyers";
const FAVORITE_SELLERS_KEY = "hisabbadi:favoriteSellers";
const FAVORITE_GRAINS_KEY = "hisabbadi:favoriteGrains";
const RECENT_MAX_ITEMS = 6;
const GRAIN_OPTIONS = [
  "Wheat",
  "Mota Dhan",
  "Mahin Dhan",
  "Paan Mansoori Dhan",
  "Kali Sarso",
  "Peeli Sarso",
  "Khari",
  "Mahua",
  "Jau",
  "Mahin Chawal",
  "Mota Chawal",
];
const PARTY_SAMPLE_OPTIONS = [
  "Deepchanda Giraiya",
  "Vinod Seth Deoria",
  "Ramesh Traders",
  "Shiv Shakti Mandi",
  "Gupta Traders",
];
const RATE_SAMPLE_OPTIONS = ["15.50", "24.00", "28.50", "31.00", "36.00"];
const REDUCTION_SAMPLE_OPTIONS = ["0.20", "0.30", "0.50", "0.75", "1.00"];
const PALLEDARI_SAMPLE_OPTIONS = ["5", "7", "10", "12", "15"];

const readRecentList = (key: string): string[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(key);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as string[];
    return parsed.filter(
      (item) => typeof item === "string" && item.trim() !== "",
    );
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
};

const normalizeForMatch = (value: string): string =>
  value.trim().toLocaleLowerCase();

const pushRecentItem = (existing: string[], value: string): string[] => {
  const normalized = value.trim();
  if (!normalized) {
    return existing;
  }

  const normalizedKey = normalizeForMatch(normalized);
  const deduped = [
    normalized,
    ...existing.filter((item) => normalizeForMatch(item) !== normalizedKey),
  ];
  return deduped.slice(0, RECENT_MAX_ITEMS);
};

const saveRecentList = (key: string, values: string[]) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(values));
};

const readDraft = (): {
  date?: string;
  buyerName?: string;
  sellerName?: string;
  grainName?: string;
  ratePerKg?: string;
  reductionPerBori?: string;
  palledariPerBori?: string;
  weightValues?: string[];
} | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const draft = window.localStorage.getItem(DRAFT_KEY);
  if (!draft) {
    return null;
  }

  try {
    return JSON.parse(draft) as {
      date?: string;
      buyerName?: string;
      sellerName?: string;
      grainName?: string;
      ratePerKg?: string;
      reductionPerBori?: string;
      palledariPerBori?: string;
      weightValues?: string[];
    };
  } catch {
    window.localStorage.removeItem(DRAFT_KEY);
    return null;
  }
};

const defaultValues = (): TransactionFormValues => ({
  date: getTodayDate(),
  buyerName: "",
  sellerName: "",
  grainName: "",
  ratePerKg: 0,
  reductionPerBori: 0,
  palledariPerBori: 0,
  weights: [],
});

type DraftShape = {
  date?: string;
  buyerName?: string;
  sellerName?: string;
  grainName?: string;
  ratePerKg?: string;
  reductionPerBori?: string;
  palledariPerBori?: string;
  weightValues?: string[];
};

const hasAnyDraftContent = (draft: {
  buyerName: string;
  sellerName: string;
  grainName: string;
  ratePerKg: string;
  reductionPerBori: string;
  palledariPerBori: string;
  weightValues: string[];
}): boolean => {
  if (
    draft.buyerName.trim() ||
    draft.sellerName.trim() ||
    draft.grainName.trim() ||
    draft.ratePerKg.trim() ||
    draft.reductionPerBori.trim() ||
    draft.palledariPerBori.trim()
  ) {
    return true;
  }

  return draft.weightValues.some((item) => item.trim() !== "");
};

export default function Form({ labels, onGenerate }: FormProps) {
  const draft = readDraft();
  const [date, setDate] = useState(draft?.date ?? getTodayDate());
  const [buyerName, setBuyerName] = useState(draft?.buyerName ?? "");
  const [sellerName, setSellerName] = useState(draft?.sellerName ?? "");
  const [grainName, setGrainName] = useState(draft?.grainName ?? "");
  const [ratePerKg, setRatePerKg] = useState(draft?.ratePerKg ?? "");
  const [reductionPerBori, setReductionPerBori] = useState(
    draft?.reductionPerBori ?? "",
  );
  const [palledariPerBori, setPalledariPerBori] = useState(
    draft?.palledariPerBori ?? "",
  );
  const [weightValues, setWeightValues] = useState<string[]>(
    draft?.weightValues && draft.weightValues.length > 0
      ? draft.weightValues
      : [],
  );
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [isDraftReady, setIsDraftReady] = useState(Boolean(draft));
  const [lastClearedDraft, setLastClearedDraft] = useState<DraftShape | null>(
    null,
  );
  const [recentBuyers, setRecentBuyers] = useState<string[]>(() =>
    readRecentList(RECENT_BUYERS_KEY),
  );
  const [recentSellers, setRecentSellers] = useState<string[]>(() =>
    readRecentList(RECENT_SELLERS_KEY),
  );
  const [recentGrains, setRecentGrains] = useState<string[]>(() =>
    readRecentList(RECENT_GRAINS_KEY),
  );
  const [favoriteBuyers, setFavoriteBuyers] = useState<string[]>(() =>
    readRecentList(FAVORITE_BUYERS_KEY),
  );
  const [favoriteSellers, setFavoriteSellers] = useState<string[]>(() =>
    readRecentList(FAVORITE_SELLERS_KEY),
  );
  const [favoriteGrains, setFavoriteGrains] = useState<string[]>(() =>
    readRecentList(FAVORITE_GRAINS_KEY),
  );

  const grainSuggestions = useMemo(() => {
    const normalizedFavorites = favoriteGrains
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const normalizedRecents = recentGrains
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const normalizedDefaults = GRAIN_OPTIONS.map((item) => item.trim()).filter(
      (item) => item.length > 0,
    );

    const result: string[] = [];
    const seen = new Set<string>();

    const addUnique = (value: string) => {
      if (seen.has(value)) {
        return;
      }

      seen.add(value);
      result.push(value);
    };

    normalizedFavorites.forEach(addUnique);
    normalizedRecents.filter((item) => !seen.has(item)).forEach(addUnique);
    normalizedDefaults.filter((item) => !seen.has(item)).forEach(addUnique);

    return result;
  }, [favoriteGrains, recentGrains]);

  const hasDraftContent = useMemo(
    () =>
      hasAnyDraftContent({
        buyerName,
        sellerName,
        grainName,
        ratePerKg,
        reductionPerBori,
        palledariPerBori,
        weightValues,
      }),
    [
      buyerName,
      sellerName,
      grainName,
      ratePerKg,
      reductionPerBori,
      palledariPerBori,
      weightValues,
    ],
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const draftPayload = {
      date,
      buyerName,
      sellerName,
      grainName,
      ratePerKg,
      reductionPerBori,
      palledariPerBori,
      weightValues,
    };

    window.localStorage.setItem(DRAFT_KEY, JSON.stringify(draftPayload));
  }, [
    date,
    buyerName,
    sellerName,
    grainName,
    ratePerKg,
    reductionPerBori,
    palledariPerBori,
    weightValues,
  ]);

  useEffect(() => {
    if (typeof window === "undefined" || !hasDraftContent) {
      return;
    }

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasDraftContent]);

  const validWeights = useMemo(
    () =>
      weightValues
        .map((item) => Number.parseFloat(item))
        .filter((value) => Number.isFinite(value) && value > 0),
    [weightValues],
  );

  const validate = (): FieldErrorMap => {
    const nextErrors: FieldErrorMap = {};

    if (!date.trim()) nextErrors.date = labels.formErrors.required;
    if (!buyerName.trim()) nextErrors.buyerName = labels.formErrors.required;
    if (!sellerName.trim()) nextErrors.sellerName = labels.formErrors.required;
    if (!grainName.trim()) nextErrors.grainName = labels.formErrors.required;

    const rate = Number.parseFloat(ratePerKg);
    if (!ratePerKg.trim()) {
      nextErrors.ratePerKg = labels.formErrors.required;
    } else if (!Number.isFinite(rate)) {
      nextErrors.ratePerKg = labels.formErrors.invalidNumber;
    } else if (rate <= 0) {
      nextErrors.ratePerKg = labels.formErrors.positiveNumber;
    }

    const reduction = Number.parseFloat(reductionPerBori);
    if (!reductionPerBori.trim()) {
      nextErrors.reductionPerBori = labels.formErrors.required;
    } else if (!Number.isFinite(reduction) || reduction < 0) {
      nextErrors.reductionPerBori = labels.formErrors.invalidNumber;
    }

    const palledari = Number.parseFloat(palledariPerBori);
    if (!palledariPerBori.trim()) {
      nextErrors.palledariPerBori = labels.formErrors.required;
    } else if (!Number.isFinite(palledari) || palledari < 0) {
      nextErrors.palledariPerBori = labels.formErrors.invalidNumber;
    }

    if (validWeights.length === 0) {
      nextErrors.weights = labels.formErrors.minOneWeight;
    }

    return nextErrors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      return;
    }

    const payload: TransactionFormValues = {
      ...defaultValues(),
      date,
      buyerName: buyerName.trim(),
      sellerName: sellerName.trim(),
      grainName: grainName.trim(),
      ratePerKg: Number.parseFloat(ratePerKg),
      reductionPerBori: Number.parseFloat(reductionPerBori),
      palledariPerBori: Number.parseFloat(palledariPerBori),
      weights: validWeights,
    };

    const nextRecentBuyers = pushRecentItem(recentBuyers, payload.buyerName);
    const nextRecentSellers = pushRecentItem(recentSellers, payload.sellerName);
    const nextRecentGrains = pushRecentItem(recentGrains, payload.grainName);

    setRecentBuyers(nextRecentBuyers);
    setRecentSellers(nextRecentSellers);
    setRecentGrains(nextRecentGrains);
    saveRecentList(RECENT_BUYERS_KEY, nextRecentBuyers);
    saveRecentList(RECENT_SELLERS_KEY, nextRecentSellers);
    saveRecentList(RECENT_GRAINS_KEY, nextRecentGrains);

    onGenerate(computeReceipt(payload));
  };

  const fieldClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500";

  const clearDraft = () => {
    const snapshot: DraftShape = {
      date,
      buyerName,
      sellerName,
      grainName,
      ratePerKg,
      reductionPerBori,
      palledariPerBori,
      weightValues,
    };

    setLastClearedDraft(snapshot);

    if (typeof window !== "undefined") {
      window.localStorage.removeItem(DRAFT_KEY);
    }

    setDate(getTodayDate());
    setBuyerName("");
    setSellerName("");
    setGrainName("");
    setRatePerKg("");
    setReductionPerBori("");
    setPalledariPerBori("");
    setWeightValues([]);
    setErrors({});
    setIsDraftReady(false);
  };

  const undoClearDraft = () => {
    if (!lastClearedDraft) {
      return;
    }

    setDate(lastClearedDraft.date ?? getTodayDate());
    setBuyerName(lastClearedDraft.buyerName ?? "");
    setSellerName(lastClearedDraft.sellerName ?? "");
    setGrainName(lastClearedDraft.grainName ?? "");
    setRatePerKg(lastClearedDraft.ratePerKg ?? "");
    setReductionPerBori(lastClearedDraft.reductionPerBori ?? "");
    setPalledariPerBori(lastClearedDraft.palledariPerBori ?? "");
    setWeightValues(
      lastClearedDraft.weightValues && lastClearedDraft.weightValues.length > 0
        ? lastClearedDraft.weightValues
        : [],
    );
    setIsDraftReady(true);
    setLastClearedDraft(null);
  };

  const toggleFavorite = (
    category: "buyers" | "sellers" | "grains",
    value: string,
  ) => {
    const normalized = value.trim();
    if (!normalized) {
      return;
    }

    if (category === "buyers") {
      const next = favoriteBuyers.includes(normalized)
        ? favoriteBuyers.filter((item) => item !== normalized)
        : pushRecentItem(favoriteBuyers, normalized);
      setFavoriteBuyers(next);
      saveRecentList(FAVORITE_BUYERS_KEY, next);
      return;
    }

    if (category === "sellers") {
      const next = favoriteSellers.includes(normalized)
        ? favoriteSellers.filter((item) => item !== normalized)
        : pushRecentItem(favoriteSellers, normalized);
      setFavoriteSellers(next);
      saveRecentList(FAVORITE_SELLERS_KEY, next);
      return;
    }

    const next = favoriteGrains.includes(normalized)
      ? favoriteGrains.filter((item) => item !== normalized)
      : pushRecentItem(favoriteGrains, normalized);
    setFavoriteGrains(next);
    saveRecentList(FAVORITE_GRAINS_KEY, next);
  };

  const Chip = ({
    value,
    onClick,
    pinned,
    onTogglePin,
  }: {
    value: string;
    onClick: () => void;
    pinned?: boolean;
    onTogglePin?: () => void;
  }) => (
    <div className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-1 py-1">
      <button
        type="button"
        onClick={onClick}
        className="rounded-full px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:text-emerald-700"
      >
        {value}
      </button>
      {onTogglePin ? (
        <button
          type="button"
          onClick={onTogglePin}
          className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${pinned ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
          aria-label={pinned ? labels.unpin : labels.pin}
        >
          {pinned ? "★" : "☆"}
        </button>
      ) : null}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs sm:flex-row sm:items-center sm:justify-end">
        <div className="flex items-center gap-3">
          {isDraftReady ? (
            <span className="font-medium text-emerald-700">
              {labels.draftReady}
            </span>
          ) : null}
          {lastClearedDraft ? (
            <button
              type="button"
              onClick={undoClearDraft}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
            >
              {labels.undoClearDraft}
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            {labels.clearDraft}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {labels.date}
          </span>
          <input
            type="date"
            className={fieldClass}
            value={date}
            onChange={(event) => setDate(event.target.value)}
          />
          {errors.date ? (
            <p className="text-xs text-red-600">{errors.date}</p>
          ) : null}
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {labels.grain}
          </span>
          <input
            type="text"
            list="grain-options-list"
            className={fieldClass}
            value={grainName}
            placeholder="Search or type grain name"
            onChange={(event) => setGrainName(event.target.value)}
            autoComplete="off"
          />
          <datalist id="grain-options-list">
            {grainSuggestions.map((grain) => (
              <option key={`grain-list-${grain}`} value={grain} />
            ))}
          </datalist>
          {favoriteGrains.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-emerald-700">
                {labels.favoriteGrains}
              </span>
              {favoriteGrains.map((item) => (
                <Chip
                  key={`fav-grain-${item}`}
                  value={item}
                  onClick={() => setGrainName(item)}
                  pinned
                  onTogglePin={() => toggleFavorite("grains", item)}
                />
              ))}
            </div>
          ) : null}
          {recentGrains.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-slate-500">
                {labels.recentGrains}
              </span>
              {recentGrains.map((item) => (
                <Chip
                  key={`grain-${item}`}
                  value={item}
                  onClick={() => setGrainName(item)}
                  pinned={favoriteGrains.includes(item)}
                  onTogglePin={() => toggleFavorite("grains", item)}
                />
              ))}
            </div>
          ) : null}
          {errors.grainName ? (
            <p className="text-xs text-red-600">{errors.grainName}</p>
          ) : null}
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {labels.buyer}
          </span>
          <input
            type="text"
            list="buyer-options"
            className={fieldClass}
            value={buyerName}
            placeholder="Enter buyer name"
            onChange={(event) => setBuyerName(event.target.value)}
          />
          <datalist id="buyer-options">
            {Array.from(
              new Set([
                ...favoriteBuyers,
                ...recentBuyers,
                ...PARTY_SAMPLE_OPTIONS,
              ]),
            ).map((item) => (
              <option key={`buyer-option-${item}`} value={item} />
            ))}
          </datalist>
          {favoriteBuyers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-emerald-700">
                {labels.favoriteBuyers}
              </span>
              {favoriteBuyers.map((item) => (
                <Chip
                  key={`fav-buyer-${item}`}
                  value={item}
                  onClick={() => setBuyerName(item)}
                  pinned
                  onTogglePin={() => toggleFavorite("buyers", item)}
                />
              ))}
            </div>
          ) : null}
          {recentBuyers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-slate-500">
                {labels.recentBuyers}
              </span>
              {recentBuyers.map((item) => (
                <Chip
                  key={`buyer-${item}`}
                  value={item}
                  onClick={() => setBuyerName(item)}
                  pinned={favoriteBuyers.includes(item)}
                  onTogglePin={() => toggleFavorite("buyers", item)}
                />
              ))}
            </div>
          ) : null}
          {errors.buyerName ? (
            <p className="text-xs text-red-600">{errors.buyerName}</p>
          ) : null}
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {labels.seller}
          </span>
          <input
            type="text"
            list="seller-options"
            className={fieldClass}
            value={sellerName}
            placeholder="Enter seller name"
            onChange={(event) => setSellerName(event.target.value)}
          />
          <datalist id="seller-options">
            {Array.from(
              new Set([
                ...favoriteSellers,
                ...recentSellers,
                ...PARTY_SAMPLE_OPTIONS,
              ]),
            ).map((item) => (
              <option key={`seller-option-${item}`} value={item} />
            ))}
          </datalist>
          {favoriteSellers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-emerald-700">
                {labels.favoriteSellers}
              </span>
              {favoriteSellers.map((item) => (
                <Chip
                  key={`fav-seller-${item}`}
                  value={item}
                  onClick={() => setSellerName(item)}
                  pinned
                  onTogglePin={() => toggleFavorite("sellers", item)}
                />
              ))}
            </div>
          ) : null}
          {recentSellers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-slate-500">
                {labels.recentSellers}
              </span>
              {recentSellers.map((item) => (
                <Chip
                  key={`seller-${item}`}
                  value={item}
                  onClick={() => setSellerName(item)}
                  pinned={favoriteSellers.includes(item)}
                  onTogglePin={() => toggleFavorite("sellers", item)}
                />
              ))}
            </div>
          ) : null}
          {errors.sellerName ? (
            <p className="text-xs text-red-600">{errors.sellerName}</p>
          ) : null}
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {labels.rate}
          </span>
          <input
            type="number"
            step="0.01"
            min="0.01"
            inputMode="decimal"
            list="rate-options"
            className={fieldClass}
            value={ratePerKg}
            placeholder="Enter rate per Kg (e.g. 24.00)"
            onChange={(event) => setRatePerKg(event.target.value)}
          />
          <datalist id="rate-options">
            {RATE_SAMPLE_OPTIONS.map((value) => (
              <option key={`rate-${value}`} value={value} />
            ))}
          </datalist>
          {errors.ratePerKg ? (
            <p className="text-xs text-red-600">{errors.ratePerKg}</p>
          ) : null}
        </label>

        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {labels.reduction}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            list="reduction-options"
            className={fieldClass}
            value={reductionPerBori}
            placeholder="Enter reduction per bori (e.g. 0.30)"
            onChange={(event) => setReductionPerBori(event.target.value)}
          />
          <datalist id="reduction-options">
            {REDUCTION_SAMPLE_OPTIONS.map((value) => (
              <option key={`reduction-${value}`} value={value} />
            ))}
          </datalist>
          {errors.reductionPerBori ? (
            <p className="text-xs text-red-600">{errors.reductionPerBori}</p>
          ) : null}
        </label>

        <label className="space-y-1 sm:col-span-2">
          <span className="text-xs font-medium text-slate-700">
            {labels.palledari}
          </span>
          <input
            type="number"
            step="0.01"
            min="0"
            inputMode="decimal"
            list="palledari-options"
            className={fieldClass}
            value={palledariPerBori}
            placeholder="Enter palledari per bori (e.g. 7)"
            onChange={(event) => setPalledariPerBori(event.target.value)}
          />
          <datalist id="palledari-options">
            {PALLEDARI_SAMPLE_OPTIONS.map((value) => (
              <option key={`palledari-${value}`} value={value} />
            ))}
          </datalist>
          {errors.palledariPerBori ? (
            <p className="text-xs text-red-600">{errors.palledariPerBori}</p>
          ) : null}
        </label>
      </div>

      <WeightInput
        label={labels.weights}
        values={weightValues}
        onChange={setWeightValues}
        error={errors.weights}
        bulkWeightLabel={labels.bulkWeightLabel}
        bulkWeightPlaceholder={labels.bulkWeightPlaceholder}
        clearWeightsLabel={labels.clearWeights}
      />

      <Button type="submit" fullWidth>
        {labels.generateReceipt}
      </Button>
    </form>
  );
}

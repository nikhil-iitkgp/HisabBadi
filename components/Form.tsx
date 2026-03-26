"use client";

import {
  FormEvent,
  KeyboardEvent as ReactKeyboardEvent,
  startTransition,
  useEffect,
  useMemo,
  useState,
} from "react";
import { computeReceipt } from "@/utils/calculations";
import {
  FieldErrorMap,
  Language,
  Labels,
  ReceiptData,
  ReceiptFormDraft,
  TransactionFormValues,
  WeightInputMode,
  getTodayDate,
} from "@/utils/types";
import Button from "./Button";
import WeightInput, { sanitizeWeightValue } from "./WeightInput";

interface FormProps {
  language: Language;
  labels: Labels;
  onGenerate: (receipt: ReceiptData) => void;
  incomingDraft?: ReceiptFormDraft | null;
  incomingDraftToken?: number;
  onRestoreLastReceipt?: () => void;
  hasLastReceipt?: boolean;
}

const DRAFT_KEY = "hisabbadi:receiptDraft";
const PARTY_DEFAULTS_KEY = "hisabbadi:partyDefaults";
const RECENT_BUYERS_KEY = "hisabbadi:recentBuyers";
const RECENT_SELLERS_KEY = "hisabbadi:recentSellers";
const RECENT_GRAINS_KEY = "hisabbadi:recentGrains";
const RECENTS_RESET_VERSION_KEY = "hisabbadi:recentsResetVersion";
const RECENTS_RESET_VERSION = "1";
const FAVORITE_BUYERS_KEY = "hisabbadi:favoriteBuyers";
const FAVORITE_SELLERS_KEY = "hisabbadi:favoriteSellers";
const FAVORITE_GRAINS_KEY = "hisabbadi:favoriteGrains";
const RECENT_MAX_ITEMS = 6;
const CHIP_VISIBLE_LIMIT = 3;
const GRAIN_OPTIONS_BY_LANGUAGE: Record<Language, string[]> = {
  en: [
    "Rice",
    "Wheat",
    "Paddy",
    "Fine Rice (Mansoori)",
    "Coarse Rice",
    "Black Mustard",
    "Yellow Mustard",
    "Barley",
    "Maize",
    "Chickpea",
    "Lentil",
    "Pea",
    "Sesame",
    "Soybean",
    "Mahua",
  ],
  hi: [
    "Chawal (Rice)",
    "Gehun (Wheat)",
    "Dhan (Paddy)",
    "Mahin Chawal (Fine Rice)",
    "Mota Chawal (Coarse Rice)",
    "Kali Sarso (Black Mustard)",
    "Peeli Sarso (Yellow Mustard)",
    "Jau (Barley)",
    "Makka (Maize)",
    "Chana (Chickpea)",
    "Masoor (Lentil)",
    "Matar (Pea)",
    "Til (Sesame)",
    "Soyabean (Soybean)",
    "Mahua (Mahua)",
  ],
};
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
const DEFAULT_WEIGHT_ROWS = 5;
const DEFAULT_WEIGHT_COLUMNS = 5;

type PartyDefaultsMap = Record<
  string,
  {
    reductionPerBori: string;
    palledariPerBori: string;
  }
>;

const formatRecentValue = (value: string): string =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .split(" ")
    .map((part) =>
      part
        ? `${part.charAt(0).toUpperCase()}${part.slice(1).toLowerCase()}`
        : "",
    )
    .join(" ");

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
    const normalized = parsed
      .filter((item) => typeof item === "string" && item.trim() !== "")
      .map((item) => formatRecentValue(item));

    const seen = new Set<string>();
    return normalized.filter((item) => {
      const key = item.toLocaleLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  } catch {
    window.localStorage.removeItem(key);
    return [];
  }
};

const ensureRecentsResetComplete = () => {
  if (typeof window === "undefined") {
    return;
  }

  const completedVersion = window.localStorage.getItem(
    RECENTS_RESET_VERSION_KEY,
  );
  if (completedVersion === RECENTS_RESET_VERSION) {
    return;
  }

  window.localStorage.removeItem(RECENT_BUYERS_KEY);
  window.localStorage.removeItem(RECENT_SELLERS_KEY);
  window.localStorage.removeItem(RECENT_GRAINS_KEY);
  window.localStorage.setItem(RECENTS_RESET_VERSION_KEY, RECENTS_RESET_VERSION);
};

const readRecentListWithReset = (key: string): string[] => {
  ensureRecentsResetComplete();
  return readRecentList(key);
};

const normalizeForMatch = (value: string): string =>
  value.trim().toLocaleLowerCase();

const pushRecentItem = (existing: string[], value: string): string[] => {
  const normalized = formatRecentValue(value);
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

const readDraft = (): ReceiptFormDraft | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const draft = window.localStorage.getItem(DRAFT_KEY);
  if (!draft) {
    return null;
  }

  try {
    return JSON.parse(draft) as ReceiptFormDraft;
  } catch {
    window.localStorage.removeItem(DRAFT_KEY);
    return null;
  }
};

const readPartyDefaults = (): PartyDefaultsMap => {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.localStorage.getItem(PARTY_DEFAULTS_KEY);
  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw) as PartyDefaultsMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    window.localStorage.removeItem(PARTY_DEFAULTS_KEY);
    return {};
  }
};

const writePartyDefaults = (defaults: PartyDefaultsMap) => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PARTY_DEFAULTS_KEY, JSON.stringify(defaults));
};

const defaultValues = (): TransactionFormValues => ({
  slipNumber: "",
  date: getTodayDate(),
  buyerName: "",
  sellerName: "",
  grainName: "",
  ratePerKg: 0,
  reductionPerBori: 0,
  palledariPerBori: 0,
  status: "final",
  tags: [],
  truckNumber: "",
  qualityNote: "",
  moistureNote: "",
  brokerName: "",
  commissionAmount: 0,
  locked: false,
  weights: [],
});

const hasAnyDraftContent = (draft: {
  buyerName: string;
  sellerName: string;
  grainName: string;
  ratePerKg: string;
  reductionPerBori: string;
  palledariPerBori: string;
  commissionAmount?: string;
  truckNumber?: string;
  qualityNote?: string;
  moistureNote?: string;
  brokerName?: string;
  weightValues: string[];
}): boolean => {
  if (
    draft.buyerName.trim() ||
    draft.sellerName.trim() ||
    draft.grainName.trim() ||
    draft.ratePerKg.trim() ||
    draft.reductionPerBori.trim() ||
    draft.palledariPerBori.trim() ||
    draft.commissionAmount?.trim() ||
    draft.truckNumber?.trim() ||
    draft.qualityNote?.trim() ||
    draft.moistureNote?.trim() ||
    draft.brokerName?.trim()
  ) {
    return true;
  }

  return draft.weightValues.some((item) => item.trim() !== "");
};

export default function Form({
  language,
  labels,
  onGenerate,
  incomingDraft,
  incomingDraftToken = 0,
  onRestoreLastReceipt,
  hasLastReceipt = false,
}: FormProps) {
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
  const [weightRows, setWeightRows] = useState(
    draft?.weightRows && draft.weightRows > 0
      ? draft.weightRows
      : DEFAULT_WEIGHT_ROWS,
  );
  const [weightColumns, setWeightColumns] = useState(
    draft?.weightColumns && draft.weightColumns > 0
      ? draft.weightColumns
      : DEFAULT_WEIGHT_COLUMNS,
  );
  const [weightInputMode, setWeightInputMode] = useState<WeightInputMode>(
    draft?.weightInputMode ?? "single",
  );
  const [tagsInput, setTagsInput] = useState((draft?.tags ?? []).join(", "));
  const [truckNumber, setTruckNumber] = useState(draft?.truckNumber ?? "");
  const [qualityNote, setQualityNote] = useState(draft?.qualityNote ?? "");
  const [moistureNote, setMoistureNote] = useState(draft?.moistureNote ?? "");
  const [brokerName, setBrokerName] = useState(draft?.brokerName ?? "");
  const [commissionAmount, setCommissionAmount] = useState(
    draft?.commissionAmount ?? "",
  );
  const [locked, setLocked] = useState(Boolean(draft?.locked));
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [recentBuyers, setRecentBuyers] = useState<string[]>(() =>
    readRecentListWithReset(RECENT_BUYERS_KEY),
  );
  const [recentSellers, setRecentSellers] = useState<string[]>(() =>
    readRecentListWithReset(RECENT_SELLERS_KEY),
  );
  const [recentGrains, setRecentGrains] = useState<string[]>(() =>
    readRecentListWithReset(RECENT_GRAINS_KEY),
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
  const [partyDefaults, setPartyDefaults] = useState<PartyDefaultsMap>(() =>
    readPartyDefaults(),
  );
  const [expandedChipGroups, setExpandedChipGroups] = useState<
    Record<string, boolean>
  >({});

  const applyDraftState = (nextDraft: ReceiptFormDraft) => {
    setDate(nextDraft.date ?? getTodayDate());
    setBuyerName(nextDraft.buyerName ?? "");
    setSellerName(nextDraft.sellerName ?? "");
    setGrainName(nextDraft.grainName ?? "");
    setRatePerKg(nextDraft.ratePerKg ?? "");
    setReductionPerBori(nextDraft.reductionPerBori ?? "");
    setPalledariPerBori(nextDraft.palledariPerBori ?? "");
    setWeightValues(
      nextDraft.weightValues && nextDraft.weightValues.length > 0
        ? nextDraft.weightValues
        : [],
    );
    setWeightRows(
      nextDraft.weightRows && nextDraft.weightRows > 0
        ? nextDraft.weightRows
        : DEFAULT_WEIGHT_ROWS,
    );
    setWeightColumns(
      nextDraft.weightColumns && nextDraft.weightColumns > 0
        ? nextDraft.weightColumns
        : DEFAULT_WEIGHT_COLUMNS,
    );
    setWeightInputMode(nextDraft.weightInputMode ?? "single");
    setTagsInput((nextDraft.tags ?? []).join(", "));
    setTruckNumber(nextDraft.truckNumber ?? "");
    setQualityNote(nextDraft.qualityNote ?? "");
    setMoistureNote(nextDraft.moistureNote ?? "");
    setBrokerName(nextDraft.brokerName ?? "");
    setCommissionAmount(nextDraft.commissionAmount ?? "");
    setLocked(Boolean(nextDraft.locked));
    setErrors({});
  };

  const grainSuggestions = useMemo(() => {
    const normalizedFavorites = favoriteGrains
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const normalizedRecents = recentGrains
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    const normalizedDefaults = GRAIN_OPTIONS_BY_LANGUAGE[language]
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

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
  }, [favoriteGrains, language, recentGrains]);

  const hasDraftContent = useMemo(
    () =>
      hasAnyDraftContent({
        buyerName,
        sellerName,
        grainName,
        ratePerKg,
        reductionPerBori,
        palledariPerBori,
        commissionAmount,
        truckNumber,
        qualityNote,
        moistureNote,
        brokerName,
        weightValues,
      }),
    [
      buyerName,
      sellerName,
      grainName,
      ratePerKg,
      reductionPerBori,
      palledariPerBori,
      commissionAmount,
      truckNumber,
      qualityNote,
      moistureNote,
      brokerName,
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
      tags: tagsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      truckNumber,
      qualityNote,
      moistureNote,
      brokerName,
      commissionAmount,
      locked,
      weightValues,
      weightRows,
      weightColumns,
      weightInputMode,
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
    tagsInput,
    truckNumber,
    qualityNote,
    moistureNote,
    brokerName,
    commissionAmount,
    locked,
    weightValues,
    weightRows,
    weightColumns,
    weightInputMode,
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

  useEffect(() => {
    if (!incomingDraft || incomingDraftToken === 0) {
      return;
    }

    startTransition(() => {
      applyDraftState(incomingDraft);
    });
  }, [incomingDraft, incomingDraftToken]);

  const validWeights = useMemo(
    () =>
      weightValues
        .map((item) => Number.parseFloat(item))
        .filter((value) => Number.isFinite(value) && value > 0),
    [weightValues],
  );

  const totalWeightPreview = useMemo(
    () => validWeights.reduce((sum, value) => sum + value, 0),
    [validWeights],
  );
  const reductionPreview = useMemo(() => {
    const parsed = Number.parseFloat(reductionPerBori);
    return Number.isFinite(parsed) && parsed >= 0
      ? parsed * validWeights.length
      : 0;
  }, [reductionPerBori, validWeights.length]);
  const netWeightPreview = totalWeightPreview - reductionPreview;

  const defaultsKey = useMemo(() => {
    const normalizedBuyer = normalizeForMatch(buyerName);
    const normalizedSeller = normalizeForMatch(sellerName);
    const normalizedGrain = normalizeForMatch(grainName);

    if (!normalizedBuyer || !normalizedSeller || !normalizedGrain) {
      return "";
    }

    return `${normalizedBuyer}@@${normalizedSeller}@@${normalizedGrain}`;
  }, [buyerName, sellerName, grainName]);

  const validationWarnings = useMemo(() => {
    const warnings: string[] = [];
    const rate = Number.parseFloat(ratePerKg);
    const palledari = Number.parseFloat(palledariPerBori);

    if (Number.isFinite(rate) && rate > 200) {
      warnings.push(labels.warningHighRate);
    }

    if (validWeights.some((weight) => weight > 200)) {
      warnings.push(labels.warningHighWeight);
    }

    if (netWeightPreview < 0) {
      warnings.push(labels.warningNegativeNet);
    }

    if (Number.isFinite(palledari) && palledari > 50) {
      warnings.push(labels.warningHighPalledari);
    }

    return warnings;
  }, [
    labels.warningHighPalledari,
    labels.warningHighRate,
    labels.warningHighWeight,
    labels.warningNegativeNet,
    netWeightPreview,
    palledariPerBori,
    ratePerKg,
    validWeights,
  ]);

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

    const commission = Number.parseFloat(commissionAmount);
    if (
      commissionAmount.trim() &&
      (!Number.isFinite(commission) || commission < 0)
    ) {
      nextErrors.commissionAmount = labels.formErrors.invalidNumber;
    }

    if (validWeights.length === 0) {
      nextErrors.weights = labels.formErrors.minOneWeight;
    }

    return nextErrors;
  };

  const focusFirstErrorField = (validationErrors: FieldErrorMap) => {
    const orderedErrorKeys: Array<keyof FieldErrorMap> = [
      "date",
      "grainName",
      "buyerName",
      "sellerName",
      "ratePerKg",
      "reductionPerBori",
      "palledariPerBori",
      "weights",
    ];

    const fieldIdByKey: Record<string, string> = {
      date: "form-date",
      grainName: "form-grain",
      buyerName: "form-buyer",
      sellerName: "form-seller",
      ratePerKg: "form-rate",
      reductionPerBori: "form-reduction",
      palledariPerBori: "form-palledari",
      weights: "form-weights",
    };

    const firstErrorKey = orderedErrorKeys.find((key) =>
      Boolean(validationErrors[key]),
    );

    if (!firstErrorKey) {
      return;
    }

    const targetId = fieldIdByKey[firstErrorKey];
    const targetElement = document.getElementById(targetId);
    if (!targetElement) {
      return;
    }

    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
    if (
      targetElement instanceof HTMLInputElement ||
      targetElement instanceof HTMLTextAreaElement ||
      targetElement instanceof HTMLSelectElement
    ) {
      targetElement.focus();
    }
  };

  const handleFormKeyDownCapture = (
    event: ReactKeyboardEvent<HTMLFormElement>,
  ) => {
    if (event.key !== "Enter" || (!event.ctrlKey && !event.metaKey)) {
      return;
    }

    event.preventDefault();
    event.currentTarget.requestSubmit();
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const validationErrors = validate();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      focusFirstErrorField(validationErrors);
      return;
    }

    const payload: TransactionFormValues = {
      ...defaultValues(),
      slipNumber: "",
      date,
      buyerName: buyerName.trim(),
      sellerName: sellerName.trim(),
      grainName: grainName.trim(),
      ratePerKg: Number.parseFloat(ratePerKg),
      reductionPerBori: Number.parseFloat(reductionPerBori),
      palledariPerBori: Number.parseFloat(palledariPerBori),
      status: "final",
      tags: tagsInput
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
      truckNumber: truckNumber.trim(),
      qualityNote: qualityNote.trim(),
      moistureNote: moistureNote.trim(),
      brokerName: brokerName.trim(),
      commissionAmount: commissionAmount.trim()
        ? Number.parseFloat(commissionAmount)
        : 0,
      locked,
      weights: validWeights,
      weightDisplayValues: weightValues.map((value) =>
        sanitizeWeightValue(value).trim(),
      ),
      weightRows,
      weightColumns,
      weightInputMode,
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

    if (defaultsKey) {
      const nextDefaults = {
        ...partyDefaults,
        [defaultsKey]: {
          reductionPerBori: reductionPerBori.trim(),
          palledariPerBori: palledariPerBori.trim(),
        },
      };
      setPartyDefaults(nextDefaults);
      writePartyDefaults(nextDefaults);
    }

    onGenerate(computeReceipt(payload));
  };

  const fieldClass =
    "h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm outline-none focus:border-emerald-500";

  const clearDraft = () => {
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
    setTagsInput("");
    setTruckNumber("");
    setQualityNote("");
    setMoistureNote("");
    setBrokerName("");
    setCommissionAmount("");
    setLocked(false);
    setWeightValues([]);
    setWeightRows(DEFAULT_WEIGHT_ROWS);
    setWeightColumns(DEFAULT_WEIGHT_COLUMNS);
    setWeightInputMode("single");
    setErrors({});
  };

  const resetSession = () => {
    setDate(getTodayDate());
    setBuyerName("");
    setSellerName("");
    setGrainName("");
    setRatePerKg("");
    setReductionPerBori("");
    setPalledariPerBori("");
    setTagsInput("");
    setTruckNumber("");
    setQualityNote("");
    setMoistureNote("");
    setBrokerName("");
    setCommissionAmount("");
    setLocked(false);
    setWeightValues([]);
    setWeightRows(DEFAULT_WEIGHT_ROWS);
    setWeightColumns(DEFAULT_WEIGHT_COLUMNS);
    setWeightInputMode("single");
    setErrors({});
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

  const toggleChipGroup = (groupKey: string) => {
    setExpandedChipGroups((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };

  const getVisibleChips = (groupKey: string, items: string[]) => {
    if (expandedChipGroups[groupKey] || items.length <= CHIP_VISIBLE_LIMIT) {
      return items;
    }

    return items.slice(0, CHIP_VISIBLE_LIMIT);
  };

  return (
    <form
      id="receipt-form"
      onSubmit={handleSubmit}
      onKeyDownCapture={handleFormKeyDownCapture}
      className="space-y-3"
    >
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs sm:flex-row sm:items-center sm:justify-end">
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
            Saved
          </span>
          <button
            type="button"
            onClick={onRestoreLastReceipt}
            disabled={!hasLastReceipt || !onRestoreLastReceipt}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 disabled:cursor-not-allowed disabled:text-slate-400"
          >
            {labels.restoreLastReceipt}
          </button>
          <button
            type="button"
            onClick={resetSession}
            className="text-xs font-semibold text-slate-600 hover:text-slate-800"
          >
            Session reset
          </button>
          <button
            type="button"
            onClick={clearDraft}
            className="text-xs font-semibold text-red-600 hover:text-red-700"
          >
            {labels.clearDraft}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <label className="space-y-1">
          <span className="text-xs font-medium text-slate-700">
            {labels.date}
          </span>
          <input
            id="form-date"
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
            id="form-grain"
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
              {getVisibleChips("favoriteGrains", favoriteGrains).map((item) => (
                <Chip
                  key={`fav-grain-${item}`}
                  value={item}
                  onClick={() => setGrainName(item)}
                  pinned
                  onTogglePin={() => toggleFavorite("grains", item)}
                />
              ))}
              {favoriteGrains.length > CHIP_VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => toggleChipGroup("favoriteGrains")}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {expandedChipGroups.favoriteGrains
                    ? "Less"
                    : `+${favoriteGrains.length - CHIP_VISIBLE_LIMIT} more`}
                </button>
              ) : null}
            </div>
          ) : null}
          {recentGrains.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-slate-500">
                {labels.recentGrains}
              </span>
              {getVisibleChips("recentGrains", recentGrains).map((item) => (
                <Chip
                  key={`grain-${item}`}
                  value={item}
                  onClick={() => setGrainName(item)}
                  pinned={favoriteGrains.includes(item)}
                  onTogglePin={() => toggleFavorite("grains", item)}
                />
              ))}
              {recentGrains.length > CHIP_VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => toggleChipGroup("recentGrains")}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {expandedChipGroups.recentGrains
                    ? "Less"
                    : `+${recentGrains.length - CHIP_VISIBLE_LIMIT} more`}
                </button>
              ) : null}
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
            id="form-buyer"
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
              {getVisibleChips("favoriteBuyers", favoriteBuyers).map((item) => (
                <Chip
                  key={`fav-buyer-${item}`}
                  value={item}
                  onClick={() => setBuyerName(item)}
                  pinned
                  onTogglePin={() => toggleFavorite("buyers", item)}
                />
              ))}
              {favoriteBuyers.length > CHIP_VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => toggleChipGroup("favoriteBuyers")}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {expandedChipGroups.favoriteBuyers
                    ? "Less"
                    : `+${favoriteBuyers.length - CHIP_VISIBLE_LIMIT} more`}
                </button>
              ) : null}
            </div>
          ) : null}
          {recentBuyers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-slate-500">
                {labels.recentBuyers}
              </span>
              {getVisibleChips("recentBuyers", recentBuyers).map((item) => (
                <Chip
                  key={`buyer-${item}`}
                  value={item}
                  onClick={() => setBuyerName(item)}
                  pinned={favoriteBuyers.includes(item)}
                  onTogglePin={() => toggleFavorite("buyers", item)}
                />
              ))}
              {recentBuyers.length > CHIP_VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => toggleChipGroup("recentBuyers")}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {expandedChipGroups.recentBuyers
                    ? "Less"
                    : `+${recentBuyers.length - CHIP_VISIBLE_LIMIT} more`}
                </button>
              ) : null}
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
            id="form-seller"
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
              {getVisibleChips("favoriteSellers", favoriteSellers).map(
                (item) => (
                  <Chip
                    key={`fav-seller-${item}`}
                    value={item}
                    onClick={() => setSellerName(item)}
                    pinned
                    onTogglePin={() => toggleFavorite("sellers", item)}
                  />
                ),
              )}
              {favoriteSellers.length > CHIP_VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => toggleChipGroup("favoriteSellers")}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {expandedChipGroups.favoriteSellers
                    ? "Less"
                    : `+${favoriteSellers.length - CHIP_VISIBLE_LIMIT} more`}
                </button>
              ) : null}
            </div>
          ) : null}
          {recentSellers.length > 0 ? (
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="w-full text-[11px] font-semibold text-slate-500">
                {labels.recentSellers}
              </span>
              {getVisibleChips("recentSellers", recentSellers).map((item) => (
                <Chip
                  key={`seller-${item}`}
                  value={item}
                  onClick={() => setSellerName(item)}
                  pinned={favoriteSellers.includes(item)}
                  onTogglePin={() => toggleFavorite("sellers", item)}
                />
              ))}
              {recentSellers.length > CHIP_VISIBLE_LIMIT ? (
                <button
                  type="button"
                  onClick={() => toggleChipGroup("recentSellers")}
                  className="rounded-full border border-slate-300 px-2 py-0.5 text-[10px] font-semibold text-slate-600"
                >
                  {expandedChipGroups.recentSellers
                    ? "Less"
                    : `+${recentSellers.length - CHIP_VISIBLE_LIMIT} more`}
                </button>
              ) : null}
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
            id="form-rate"
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
            id="form-reduction"
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
            id="form-palledari"
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

      {validationWarnings.length > 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3">
          <p className="mb-1 text-xs font-semibold text-amber-800">
            {labels.suspiciousValues}
          </p>
          <div className="space-y-1">
            {validationWarnings.map((warning) => (
              <p key={warning} className="text-xs text-amber-700">
                {warning}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div id="form-weights">
        <WeightInput
          label={labels.weights}
          values={weightValues}
          onChange={setWeightValues}
          rows={weightRows}
          columns={weightColumns}
          onRowsChange={setWeightRows}
          onColumnsChange={setWeightColumns}
          mode={weightInputMode}
          onModeChange={setWeightInputMode}
          error={errors.weights}
          bulkWeightLabel={labels.bulkWeightLabel}
          bulkWeightPlaceholder={labels.bulkWeightPlaceholder}
          clearWeightsLabel={labels.clearWeights}
          undoLastWeightLabel={labels.undoLastWeight}
          weightInputModeLabel={labels.weightInputModeLabel}
          singleRowModeLabel={labels.singleRowMode}
          tableModeLabel={labels.tableMode}
          rowsLabel={labels.rows}
          columnsLabel={labels.columns}
          gridHint={labels.weightGridHint}
        />
      </div>

      <Button type="submit" fullWidth>
        {labels.generateReceipt}
      </Button>
    </form>
  );
}

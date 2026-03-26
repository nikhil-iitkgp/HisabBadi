import {
  CalculationResult,
  Labels,
  ReceiptData,
  SettlementPerspective,
  SettlementSummary,
  TransactionFormValues,
} from "./types";

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

const formatPerBoriLabel = (
  values: number[],
  formatter: (value: number) => string,
): string => {
  const normalized = Array.from(
    new Set(values.map((value) => roundToTwo(value).toFixed(2))),
  );

  if (normalized.length === 0) {
    return "-";
  }

  if (normalized.length === 1) {
    return formatter(Number.parseFloat(normalized[0]));
  }

  return "Mixed";
};

const getReceiptDisplayWeights = (receipt: ReceiptData): string[] =>
  receipt.weightDisplayValues?.filter((weight) => weight.trim() !== "") ??
  receipt.weights.map((weight) => formatWeight(weight));

export const getReceiptWeightGrid = (
  receipt: ReceiptData,
): {
  rows: number;
  columns: number;
  values: string[];
} => {
  const values =
    receipt.weightDisplayValues && receipt.weightDisplayValues.length > 0
      ? [...receipt.weightDisplayValues]
      : receipt.weights.map((weight) => formatWeight(weight));

  const rows = Math.max(receipt.weightRows ?? values.length ?? 1, 1);
  const columns = Math.max(receipt.weightColumns ?? 1, 1);
  const totalCells = Math.max(rows * columns, values.length);
  const gridValues = Array.from({ length: totalCells }, (_, index) => values[index] ?? "");

  return {
    rows,
    columns,
    values: gridValues,
  };
};

export const calculateTotalWeight = (weights: number[]): number => {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  return roundToTwo(total);
};

export const calculateReducedWeight = (
  boriCount: number,
  reductionPerBori: number,
): number => roundToTwo(boriCount * reductionPerBori);

export const calculateNetWeight = (
  totalWeight: number,
  reducedWeight: number,
): number => roundToTwo(totalWeight - reducedWeight);

export const calculateAmount = (netWeight: number, ratePerKg: number): number =>
  roundToTwo(netWeight * ratePerKg);

export const calculateFinal = (amount: number, totalPalledari: number): number =>
  roundToTwo(amount - totalPalledari);

export const computeReceipt = (
  input: TransactionFormValues,
): ReceiptData & CalculationResult => {
  const boriCount = input.weights.length;
  const totalWeight = calculateTotalWeight(input.weights);
  const reducedWeight = calculateReducedWeight(boriCount, input.reductionPerBori);
  const netWeight = calculateNetWeight(totalWeight, reducedWeight);
  const grossAmount = calculateAmount(netWeight, input.ratePerKg);
  const amount = roundToTwo(grossAmount - (input.commissionAmount ?? 0));
  const totalPalledari = roundToTwo(boriCount * input.palledariPerBori);
  const finalPayment = calculateFinal(amount, totalPalledari);

  return {
    ...input,
    boriCount,
    totalWeight,
    reducedWeight,
    netWeight,
    grossAmount,
    amount,
    totalPalledari,
    totalCommission: roundToTwo(input.commissionAmount ?? 0),
    finalPayment,
  };
};

export const formatNumber = (value: number): string => value.toFixed(2);

export const formatWeight = (value: number): string => value.toFixed(1);

export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export const formatReceiptDate = (rawDate: string): string => {
  const date = new Date(rawDate);
  if (Number.isNaN(date.getTime())) {
    return rawDate;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export const buildReceiptSummaryText = (
  receipt: ReceiptData,
  labels: Labels,
): string => {
  const formattedWeights = getReceiptDisplayWeights(receipt).join(" ");

  return [
    `${labels.title} - RECEIPT`,
    `${labels.date}: ${formatReceiptDate(receipt.date)}`,
    `${labels.buyer}: ${receipt.buyerName}`,
    `${labels.seller}: ${receipt.sellerName}`,
    `${labels.grain}: ${receipt.grainName}`,
    receipt.tags?.length ? `${labels.receiptTags}: ${receipt.tags.join(", ")}` : "",
    receipt.truckNumber ? `${labels.truckNumber}: ${receipt.truckNumber}` : "",
    receipt.qualityNote ? `${labels.quality}: ${receipt.qualityNote}` : "",
    receipt.moistureNote ? `${labels.moisture}: ${receipt.moistureNote}` : "",
    receipt.brokerName ? `${labels.brokerName}: ${receipt.brokerName}` : "",
    `${labels.rate}: ${formatCurrency(receipt.ratePerKg)} / Kg`,
    `${labels.bori}: ${receipt.boriCount}`,
    `${labels.weights}: ${formattedWeights}`,
    `${labels.totalWeight}: ${formatNumber(receipt.totalWeight)} Kg`,
    `${labels.reducedWeight}: ${formatNumber(receipt.reducedWeight)} Kg`,
    `${labels.netWeight}: ${formatNumber(receipt.netWeight)} Kg`,
    `${labels.amount}: ${formatCurrency(receipt.amount)}`,
    receipt.totalCommission
      ? `${labels.commission}: ${formatCurrency(receipt.totalCommission)}`
      : "",
    `${labels.palledari}: ${formatCurrency(receipt.totalPalledari)}`,
    `${labels.finalPayment}: ${formatCurrency(receipt.finalPayment)}`,
  ]
    .filter(Boolean)
    .join("\n");
};

export const computeSettlementSummary = (
  receipts: ReceiptData[],
  perspective: SettlementPerspective,
  primaryPartyName: string,
): SettlementSummary => {
  const trimmedPrimaryParty = primaryPartyName.trim();
  const relevantReceipts = receipts.filter((receipt) =>
    perspective === "seller"
      ? receipt.sellerName.trim() === trimmedPrimaryParty
      : receipt.buyerName.trim() === trimmedPrimaryParty,
  );

  const partyMap = new Map<
    string,
    {
      receiptCount: number;
      totalAmount: number;
      totalPalledari: number;
      finalPayment: number;
      grains: Map<
        string,
        {
          grainName: string;
          ratePerKg: number;
          receiptCount: number;
          totalBoriCount: number;
          reductionPerBoriValues: number[];
          palledariPerBoriValues: number[];
          totalReducedWeight: number;
          totalNetWeight: number;
          weightDisplayValues: string[];
          receipts: ReceiptData[];
          totalAmount: number;
          totalPalledari: number;
          finalPayment: number;
        }
      >;
    }
  >();

  for (const receipt of relevantReceipts) {
    const partyName =
      perspective === "seller"
        ? receipt.buyerName.trim()
        : receipt.sellerName.trim();

    const currentParty = partyMap.get(partyName) ?? {
      receiptCount: 0,
      totalAmount: 0,
      totalPalledari: 0,
      finalPayment: 0,
      grains: new Map(),
    };

    const grainKey = `${receipt.grainName.trim()}@@${receipt.ratePerKg.toFixed(4)}`;
    const currentGrain = currentParty.grains.get(grainKey) ?? {
      grainName: receipt.grainName.trim(),
      ratePerKg: receipt.ratePerKg,
      receiptCount: 0,
      totalBoriCount: 0,
      reductionPerBoriValues: [],
      palledariPerBoriValues: [],
      totalReducedWeight: 0,
      totalNetWeight: 0,
      weightDisplayValues: [],
      receipts: [],
      totalAmount: 0,
      totalPalledari: 0,
      finalPayment: 0,
    };

    currentGrain.receiptCount += 1;
    currentGrain.totalBoriCount += receipt.boriCount;
    currentGrain.reductionPerBoriValues.push(receipt.reductionPerBori);
    currentGrain.palledariPerBoriValues.push(receipt.palledariPerBori);
    currentGrain.totalReducedWeight = roundToTwo(
      currentGrain.totalReducedWeight + receipt.reducedWeight,
    );
    currentGrain.totalNetWeight = roundToTwo(
      currentGrain.totalNetWeight + receipt.netWeight,
    );
    currentGrain.weightDisplayValues.push(...getReceiptDisplayWeights(receipt));
    currentGrain.receipts.push(receipt);
    currentGrain.totalAmount = roundToTwo(currentGrain.totalAmount + receipt.amount);
    currentGrain.totalPalledari = roundToTwo(
      currentGrain.totalPalledari + receipt.totalPalledari,
    );
    currentGrain.finalPayment = roundToTwo(
      currentGrain.finalPayment + receipt.finalPayment,
    );
    currentParty.grains.set(grainKey, currentGrain);

    currentParty.receiptCount += 1;
    currentParty.totalAmount = roundToTwo(currentParty.totalAmount + receipt.amount);
    currentParty.totalPalledari = roundToTwo(
      currentParty.totalPalledari + receipt.totalPalledari,
    );
    currentParty.finalPayment = roundToTwo(
      currentParty.finalPayment + receipt.finalPayment,
    );

    partyMap.set(partyName, currentParty);
  }

  const partyGroups = Array.from(partyMap.entries())
    .map(([partyName, value]) => ({
      partyName,
      receiptCount: value.receiptCount,
      totalAmount: roundToTwo(value.totalAmount),
      totalPalledari: roundToTwo(value.totalPalledari),
      finalPayment: roundToTwo(value.finalPayment),
      grains: Array.from(value.grains.values())
        .map((grain) => ({
          grainName: grain.grainName,
          ratePerKg: grain.ratePerKg,
          receiptCount: grain.receiptCount,
          totalBoriCount: grain.totalBoriCount,
          reductionPerBoriLabel: formatPerBoriLabel(
            grain.reductionPerBoriValues,
            (value) => `${formatNumber(value)} Kg / bori`,
          ),
          palledariPerBoriLabel: formatPerBoriLabel(
            grain.palledariPerBoriValues,
            (value) => `${formatCurrency(value)} / bori`,
          ),
          totalReducedWeight: roundToTwo(grain.totalReducedWeight),
          totalNetWeight: roundToTwo(grain.totalNetWeight),
          weightDisplayValues: grain.weightDisplayValues.filter(
            (weight) => weight.trim() !== "",
          ),
          receipts: grain.receipts,
          totalAmount: roundToTwo(grain.totalAmount),
          totalPalledari: roundToTwo(grain.totalPalledari),
          finalPayment: roundToTwo(grain.finalPayment),
        }))
        .sort((left, right) => {
          const byName = left.grainName.localeCompare(right.grainName);
          if (byName !== 0) {
            return byName;
          }
          return left.ratePerKg - right.ratePerKg;
        }),
    }))
    .sort((left, right) => left.partyName.localeCompare(right.partyName));

  const totalAmount = roundToTwo(
    relevantReceipts.reduce((sum, receipt) => sum + receipt.amount, 0),
  );
  const totalWeight = roundToTwo(
    relevantReceipts.reduce((sum, receipt) => sum + receipt.totalWeight, 0),
  );
  const totalNetWeight = roundToTwo(
    relevantReceipts.reduce((sum, receipt) => sum + receipt.netWeight, 0),
  );
  const totalPalledari = roundToTwo(
    relevantReceipts.reduce((sum, receipt) => sum + receipt.totalPalledari, 0),
  );
  const totalCommission = roundToTwo(
    relevantReceipts.reduce(
      (sum, receipt) => sum + (receipt.totalCommission ?? 0),
      0,
    ),
  );
  const finalCollection = roundToTwo(
    relevantReceipts.reduce((sum, receipt) => sum + receipt.finalPayment, 0),
  );

  const grainNames = Array.from(
    new Set(relevantReceipts.map((receipt) => receipt.grainName.trim())),
  ).filter(Boolean);

  return {
    perspective,
    date: new Date().toISOString().slice(0, 10),
    primaryPartyName: trimmedPrimaryParty,
    selectedReceipts: relevantReceipts.length,
    partyGroups,
    totalWeight,
    totalNetWeight,
    totalAmount,
    totalPalledari,
    totalCommission,
    finalCollection,
    grainNames,
    receipts: relevantReceipts,
  };
};

export const buildSettlementSummaryText = (
  settlement: SettlementSummary,
  labels: Labels,
): string => {
  const primaryLabel =
    settlement.perspective === "seller" ? labels.seller : labels.buyer;
  const partyHeading =
    settlement.perspective === "seller"
      ? labels.buyerWiseTotals
      : labels.sellerWiseTotals;

  return [
    `${labels.title} - ${labels.settlementTitle}`,
    `${settlement.perspective === "seller" ? labels.settlementFromSeller : labels.settlementFromBuyer}`,
    `${labels.date}: ${formatReceiptDate(settlement.date)}`,
    `${primaryLabel}: ${settlement.primaryPartyName}`,
    `${labels.selectedReceiptsCount}: ${settlement.selectedReceipts}`,
    `${labels.grain}: ${settlement.grainNames.join(", ") || "-"}`,
    `${labels.netWeight}: ${formatNumber(settlement.totalNetWeight)} Kg`,
    `${labels.amount}: ${formatCurrency(settlement.totalAmount)}`,
    `${labels.palledari}: ${formatCurrency(settlement.totalPalledari)}`,
    `${labels.finalCollection}: ${formatCurrency(settlement.finalCollection)}`,
    "",
    partyHeading,
    ...settlement.partyGroups.flatMap((party) => [
      `- ${party.partyName} (${party.receiptCount}): ${formatCurrency(party.finalPayment)}`,
      ...party.grains.flatMap((grain) =>
        grain.receipts.map((receipt) =>
          [
            `  - ${receipt.grainName} @ ${formatNumber(receipt.ratePerKg)} | ${labels.bori}: ${receipt.boriCount} | ${labels.totalWeight}: ${formatNumber(receipt.totalWeight)} Kg`,
            `    ${labels.reduction}: ${formatNumber(receipt.reductionPerBori)} Kg / bori | ${labels.reducedWeight}: ${formatNumber(receipt.reducedWeight)} Kg`,
            `    ${labels.netWeight}: ${formatNumber(receipt.netWeight)} Kg | ${labels.amount}: ${formatCurrency(receipt.amount)}`,
            `    ${labels.palledari}: ${formatCurrency(receipt.palledariPerBori)} / bori | Total ${labels.palledari}: ${formatCurrency(receipt.totalPalledari)}`,
            receipt.totalCommission
              ? `    ${labels.commission}: ${formatCurrency(receipt.totalCommission)}`
              : "",
          ].join("\n"),
        ),
      ),
    ]),
  ].join("\n");
};

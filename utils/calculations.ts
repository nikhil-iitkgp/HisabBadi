import {
  CalculationResult,
  Labels,
  ReceiptData,
  SettlementPerspective,
  SettlementSummary,
  TransactionFormValues,
} from "./types";

const roundToTwo = (value: number): number => Math.round(value * 100) / 100;

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
  const amount = calculateAmount(netWeight, input.ratePerKg);
  const totalPalledari = roundToTwo(boriCount * input.palledariPerBori);
  const finalPayment = calculateFinal(amount, totalPalledari);

  return {
    ...input,
    boriCount,
    totalWeight,
    reducedWeight,
    netWeight,
    amount,
    totalPalledari,
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
  return [
    `${labels.title} - RECEIPT`,
    `${labels.date}: ${formatReceiptDate(receipt.date)}`,
    `${labels.buyer}: ${receipt.buyerName}`,
    `${labels.seller}: ${receipt.sellerName}`,
    `${labels.grain}: ${receipt.grainName}`,
    `${labels.rate}: ${formatCurrency(receipt.ratePerKg)} / Kg`,
    `${labels.bori}: ${receipt.boriCount}`,
    `${labels.totalWeight}: ${formatNumber(receipt.totalWeight)} Kg`,
    `${labels.reducedWeight}: ${formatNumber(receipt.reducedWeight)} Kg`,
    `${labels.netWeight}: ${formatNumber(receipt.netWeight)} Kg`,
    `${labels.amount}: ${formatCurrency(receipt.amount)}`,
    `${labels.palledari}: ${formatCurrency(receipt.totalPalledari)}`,
    `${labels.finalPayment}: ${formatCurrency(receipt.finalPayment)}`,
  ].join("\n");
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
      totalAmount: 0,
      totalPalledari: 0,
      finalPayment: 0,
    };

    currentGrain.receiptCount += 1;
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
          ...grain,
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
  const totalPalledari = roundToTwo(
    relevantReceipts.reduce((sum, receipt) => sum + receipt.totalPalledari, 0),
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
    totalAmount,
    totalPalledari,
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
    `${labels.amount}: ${formatCurrency(settlement.totalAmount)}`,
    `${labels.palledari}: ${formatCurrency(settlement.totalPalledari)}`,
    `${labels.finalCollection}: ${formatCurrency(settlement.finalCollection)}`,
    "",
    partyHeading,
    ...settlement.partyGroups.flatMap((party) => [
      `- ${party.partyName} (${party.receiptCount}): ${formatCurrency(party.finalPayment)}`,
      ...party.grains.map(
        (grain) =>
          `  • ${grain.grainName} @ ${formatNumber(grain.ratePerKg)}: ${formatCurrency(grain.finalPayment)}`,
      ),
    ]),
  ].join("\n");
};
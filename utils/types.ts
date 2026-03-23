export type Language = "en" | "hi";

export interface TransactionFormValues {
  date: string;
  buyerName: string;
  sellerName: string;
  grainName: string;
  ratePerKg: number;
  reductionPerBori: number;
  palledariPerBori: number;
  weights: number[];
}

export interface CalculationResult {
  boriCount: number;
  totalWeight: number;
  reducedWeight: number;
  netWeight: number;
  amount: number;
  totalPalledari: number;
  finalPayment: number;
}

export interface ReceiptData extends TransactionFormValues, CalculationResult {}

export type SettlementPerspective = "seller" | "buyer";

export interface SettlementGrainLine {
  grainName: string;
  ratePerKg: number;
  receiptCount: number;
  totalAmount: number;
  totalPalledari: number;
  finalPayment: number;
}

export interface SettlementPartyGroup {
  partyName: string;
  receiptCount: number;
  totalAmount: number;
  totalPalledari: number;
  finalPayment: number;
  grains: SettlementGrainLine[];
}

export interface SettlementSummary {
  perspective: SettlementPerspective;
  date: string;
  primaryPartyName: string;
  selectedReceipts: number;
  partyGroups: SettlementPartyGroup[];
  totalAmount: number;
  totalPalledari: number;
  finalCollection: number;
  grainNames: string[];
  receipts: ReceiptData[];
}

export interface FieldErrorMap {
  date?: string;
  buyerName?: string;
  sellerName?: string;
  grainName?: string;
  ratePerKg?: string;
  reductionPerBori?: string;
  palledariPerBori?: string;
  weights?: string;
}

export type Labels = {
  title: string;
  subtitle: string;
  language: string;
  date: string;
  buyer: string;
  seller: string;
  grain: string;
  rate: string;
  reduction: string;
  palledari: string;
  bori: string;
  weights: string;
  totalWeight: string;
  reducedWeight: string;
  netWeight: string;
  amount: string;
  finalPayment: string;
  generateReceipt: string;
  printAsPdf: string;
  editDetails: string;
  compactPrintMode: string;
  copySummary: string;
  whatsappText: string;
  whatsappPng: string;
  downloadPng: string;
  installApp: string;
  recentBuyers: string;
  recentSellers: string;
  recentGrains: string;
  favoriteBuyers: string;
  favoriteSellers: string;
  favoriteGrains: string;
  pin: string;
  unpin: string;
  clearDraft: string;
  undoClearDraft: string;
  draftReady: string;
  receiptHistory: string;
  historySearch: string;
  loadReceipt: string;
  clearHistory: string;
  exportHistoryCsv: string;
  settlementTitle: string;
  settlementFromSeller: string;
  settlementFromBuyer: string;
  settlementForSeller: string;
  selectSeller: string;
  selectBuyer: string;
  selectAll: string;
  selectLatest3: string;
  selectLatest5: string;
  unselectAll: string;
  selectedReceiptsCount: string;
  selectedBuyers: string;
  selectedSellers: string;
  generateSettlement: string;
  clearSelection: string;
  buyerWiseTotals: string;
  sellerWiseTotals: string;
  grainWiseBreakdown: string;
  finalCollection: string;
  noSettlementReceipts: string;
  bulkWeightLabel: string;
  bulkWeightPlaceholder: string;
  clearWeights: string;
  formErrors: {
    required: string;
    invalidNumber: string;
    positiveNumber: string;
    minOneWeight: string;
  };
};

export const LANGUAGE_LABELS: Record<Language, Labels> = {
  en: {
    title: "HisabBadi",
    subtitle: "Mandi Receipt Generator",
    language: "Language",
    date: "Date",
    buyer: "Buyer",
    seller: "Seller",
    grain: "Grain",
    rate: "Rate (₹ / Kg)",
    reduction: "Reduction (Kg / bori)",
    palledari: "Palledari (₹ / bori)",
    bori: "Bori",
    weights: "Weights",
    totalWeight: "Total Weight",
    reducedWeight: "Reduced Weight",
    netWeight: "Net Weight",
    amount: "Amount",
    finalPayment: "Final Payment",
    generateReceipt: "Generate Receipt",
    printAsPdf: "Print / Save PDF",
    editDetails: "Edit Details",
    compactPrintMode: "Compact Print Mode",
    copySummary: "Copy Summary",
    whatsappText: "WhatsApp Text",
    whatsappPng: "WhatsApp PNG",
    downloadPng: "Download PNG",
    installApp: "Install App",
    recentBuyers: "Recent Buyers",
    recentSellers: "Recent Sellers",
    recentGrains: "Recent Grains",
    favoriteBuyers: "Favorite Buyers",
    favoriteSellers: "Favorite Sellers",
    favoriteGrains: "Favorite Grains",
    pin: "Pin",
    unpin: "Unpin",
    clearDraft: "Clear Draft",
    undoClearDraft: "Undo Clear",
    draftReady: "Draft auto-saved",
    receiptHistory: "Recent Receipts",
    historySearch: "Search history...",
    loadReceipt: "Load",
    clearHistory: "Clear History",
    exportHistoryCsv: "Export CSV",
    settlementTitle: "Final Settlement",
    settlementFromSeller: "Seller Perspective",
    settlementFromBuyer: "Buyer Perspective",
    settlementForSeller: "Settlement for Seller",
    selectSeller: "Select Seller",
    selectBuyer: "Select Buyer",
    selectAll: "Select All",
    selectLatest3: "Latest 3",
    selectLatest5: "Latest 5",
    unselectAll: "Unselect All",
    selectedReceiptsCount: "Selected Receipts",
    selectedBuyers: "Selected Buyers",
    selectedSellers: "Selected Sellers",
    generateSettlement: "Generate Final Settlement",
    clearSelection: "Clear Selection",
    buyerWiseTotals: "Buyer-wise Totals",
    sellerWiseTotals: "Seller-wise Totals",
    grainWiseBreakdown: "Grain-wise Breakdown",
    finalCollection: "Final Collection",
    noSettlementReceipts: "Select at least one receipt for selected party.",
    bulkWeightLabel: "Quick Paste Weights (space-separated)",
    bulkWeightPlaceholder: "Example: 58.9 61.4 60 62.5",
    clearWeights: "Clear Weights",
    formErrors: {
      required: "This field is required.",
      invalidNumber: "Enter a valid number.",
      positiveNumber: "Enter a number greater than zero.",
      minOneWeight: "Add at least one valid weight.",
    },
  },
  hi: {
    title: "HisabBadi",
    subtitle: "Mandi Receipt Generator",
    language: "Bhasha",
    date: "Tareekh",
    buyer: "Khareedar",
    seller: "Bechne Wala",
    grain: "Anaj",
    rate: "Rate (₹ / Kg)",
    reduction: "Katauti (Kg / bori)",
    palledari: "Palledari (₹ / bori)",
    bori: "Bori",
    weights: "Wajan",
    totalWeight: "Kul Wajan",
    reducedWeight: "Katauti Wajan",
    netWeight: "Net Wajan",
    amount: "Amount",
    finalPayment: "Final Payment",
    generateReceipt: "Receipt Banao",
    printAsPdf: "Print / Save PDF",
    editDetails: "Details Badlo",
    compactPrintMode: "Compact Print Mode",
    copySummary: "Summary Copy",
    whatsappText: "WhatsApp Text",
    whatsappPng: "WhatsApp PNG",
    downloadPng: "PNG Download",
    installApp: "App Install",
    recentBuyers: "Pichhle Khareedar",
    recentSellers: "Pichhle Bechne Wale",
    recentGrains: "Pichhle Anaj",
    favoriteBuyers: "Pasandida Khareedar",
    favoriteSellers: "Pasandida Bechne Wale",
    favoriteGrains: "Pasandida Anaj",
    pin: "Pin",
    unpin: "Unpin",
    clearDraft: "Draft Saaf Karo",
    undoClearDraft: "Undo Clear",
    draftReady: "Draft auto-save hai",
    receiptHistory: "Pichhli Receipts",
    historySearch: "History search...",
    loadReceipt: "Load",
    clearHistory: "History Saaf",
    exportHistoryCsv: "CSV Export",
    settlementTitle: "Final Settlement",
    settlementFromSeller: "Seller Perspective",
    settlementFromBuyer: "Buyer Perspective",
    settlementForSeller: "Seller Settlement",
    selectSeller: "Seller Chune",
    selectBuyer: "Buyer Chune",
    selectAll: "Sab Chune",
    selectLatest3: "Aakhri 3",
    selectLatest5: "Aakhri 5",
    unselectAll: "Sab Hataye",
    selectedReceiptsCount: "Chuni Hui Receipts",
    selectedBuyers: "Chune Hue Buyers",
    selectedSellers: "Chune Hue Sellers",
    generateSettlement: "Final Settlement Banao",
    clearSelection: "Selection Saaf",
    buyerWiseTotals: "Buyer-wise Total",
    sellerWiseTotals: "Seller-wise Total",
    grainWiseBreakdown: "Anaj-wise Breakdown",
    finalCollection: "Final Collection",
    noSettlementReceipts: "Selected party ki kam se kam ek receipt chune.",
    bulkWeightLabel: "Jaldi Paste Wajan (space-separated)",
    bulkWeightPlaceholder: "Udaharan: 58.9 61.4 60 62.5",
    clearWeights: "Wajan Saaf Karo",
    formErrors: {
      required: "Yeh field zaroori hai.",
      invalidNumber: "Sahi number dalo.",
      positiveNumber: "Zero se bada number dalo.",
      minOneWeight: "Kam se kam ek sahi wajan dalo.",
    },
  },
};

export const getTodayDate = (): string => new Date().toISOString().slice(0, 10);
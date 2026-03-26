export type Language = "en" | "hi";
export type WeightInputMode = "single" | "table";
export type ReceiptStatus = "draft" | "final" | "settled" | "paid";
export type PrintTemplate = "standard" | "compact" | "ledger";

export interface ReceiptFormDraft {
  slipNumber?: string;
  date?: string;
  buyerName?: string;
  sellerName?: string;
  grainName?: string;
  ratePerKg?: string;
  reductionPerBori?: string;
  palledariPerBori?: string;
  weightValues?: string[];
  weightRows?: number;
  weightColumns?: number;
  weightInputMode?: WeightInputMode;
  status?: ReceiptStatus;
  tags?: string[];
  truckNumber?: string;
  qualityNote?: string;
  moistureNote?: string;
  brokerName?: string;
  commissionAmount?: string;
  locked?: boolean;
}

export interface TransactionFormValues {
  slipNumber: string;
  date: string;
  buyerName: string;
  sellerName: string;
  grainName: string;
  ratePerKg: number;
  reductionPerBori: number;
  palledariPerBori: number;
  status: ReceiptStatus;
  tags?: string[];
  truckNumber?: string;
  qualityNote?: string;
  moistureNote?: string;
  brokerName?: string;
  commissionAmount?: number;
  locked?: boolean;
  weights: number[];
  weightDisplayValues?: string[];
  weightRows?: number;
  weightColumns?: number;
  weightInputMode?: WeightInputMode;
}

export interface CalculationResult {
  boriCount: number;
  totalWeight: number;
  reducedWeight: number;
  netWeight: number;
  grossAmount?: number;
  amount: number;
  roundingAdjustment?: number;
  totalPalledari: number;
  totalCommission?: number;
  finalPayment: number;
}

export interface ReceiptData extends TransactionFormValues, CalculationResult {}

export type SettlementPerspective = "seller" | "buyer";

export interface SettlementGrainLine {
  grainName: string;
  ratePerKg: number;
  receiptCount: number;
  totalBoriCount: number;
  reductionPerBoriLabel: string;
  palledariPerBoriLabel: string;
  totalReducedWeight: number;
  totalNetWeight: number;
  weightDisplayValues: string[];
  receipts: ReceiptData[];
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
  title?: string;
  note?: string;
  selectedReceipts: number;
  partyGroups: SettlementPartyGroup[];
  totalWeight: number;
  totalNetWeight: number;
  totalAmount: number;
  totalPalledari: number;
  totalCommission?: number;
  previousBalance?: number;
  cashPaid?: number;
  roundingAdjustment?: number;
  finalCollection: number;
  grainNames: string[];
  receipts: ReceiptData[];
}

export interface FieldErrorMap {
  slipNumber?: string;
  date?: string;
  buyerName?: string;
  sellerName?: string;
  grainName?: string;
  ratePerKg?: string;
  reductionPerBori?: string;
  palledariPerBori?: string;
  commissionAmount?: string;
  weights?: string;
}

export type Labels = {
  title: string;
  subtitle: string;
  language: string;
  slipNumber: string;
  date: string;
  buyer: string;
  seller: string;
  grain: string;
  rate: string;
  reduction: string;
  palledari: string;
  commission: string;
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
  autoSaveCurrentReceipt: string;
  restoreLastReceipt: string;
  restoreLastReceiptEmpty: string;
  receiptStatus: string;
  receiptTags: string;
  customNotes: string;
  truckNumber: string;
  quality: string;
  moisture: string;
  brokerName: string;
  receiptHistory: string;
  historyFilters: string;
  historySearch: string;
  filterDateFrom: string;
  filterDateTo: string;
  filterGrain: string;
  filterBuyer: string;
  filterSeller: string;
  filterMinRate: string;
  filterMaxRate: string;
  quickToday: string;
  quickThisWeek: string;
  quickThisMonth: string;
  sortHistory: string;
  sortLatest: string;
  sortOldest: string;
  sortAmount: string;
  sortRate: string;
  sortBuyer: string;
  sortSeller: string;
  loadReceipt: string;
  editHistoryItem: string;
  duplicateReceipt: string;
  duplicateClearWeights: string;
  deleteHistoryItem: string;
  confirmDeleteHistoryItem: string;
  lockReceipt: string;
  unlockReceipt: string;
  clearHistory: string;
  exportHistoryCsv: string;
  backupData: string;
  restoreData: string;
  exportSettlementCsv: string;
  settlementPdf: string;
  simpleWhatsappText: string;
  stickyGenerate: string;
  stickySettlement: string;
  stickyPrint: string;
  settlementTitle: string;
  settlementName: string;
  settlementNote: string;
  previousBalance: string;
  cashPaid: string;
  roundingAdjustment: string;
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
  bulkSelectFiltered: string;
  buyerWiseTotals: string;
  sellerWiseTotals: string;
  grainWiseBreakdown: string;
  finalCollection: string;
  ledgerView: string;
  runningBalance: string;
  analytics: string;
  topGrains: string;
  topBuyers: string;
  topSellers: string;
  averageRate: string;
  printTemplate: string;
  printTemplateStandard: string;
  printTemplateCompact: string;
  printTemplateLedger: string;
  noSettlementReceipts: string;
  bulkWeightLabel: string;
  bulkWeightPlaceholder: string;
  clearWeights: string;
  undoLastWeight: string;
  clearRow: string;
  clearColumn: string;
  weightInputModeLabel: string;
  singleRowMode: string;
  tableMode: string;
  settlementShowWeights: string;
  rows: string;
  columns: string;
  weightGridHint: string;
  savedDefaults: string;
  useSavedDefaults: string;
  defaultsSaved: string;
  suspiciousValues: string;
  warningHighRate: string;
  warningHighWeight: string;
  warningNegativeNet: string;
  warningHighPalledari: string;
  statusDraft: string;
  statusFinal: string;
  statusSettled: string;
  statusPaid: string;
  tagCash: string;
  tagUdhaar: string;
  tagPending: string;
  tagSample: string;
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
    slipNumber: "Slip Number",
    date: "Date",
    buyer: "Buyer",
    seller: "Seller",
    grain: "Grain",
    rate: "Rate (₹ / Kg)",
    reduction: "Reduction (Kg / bori)",
    palledari: "Palledari (₹ / bori)",
    commission: "Commission",
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
    autoSaveCurrentReceipt: "Auto Save Current Receipt",
    restoreLastReceipt: "Restore Last Receipt",
    restoreLastReceiptEmpty: "No last receipt saved yet.",
    receiptStatus: "Receipt Status",
    receiptTags: "Receipt Tags",
    customNotes: "Custom Notes",
    truckNumber: "Truck Number",
    quality: "Quality",
    moisture: "Moisture",
    brokerName: "Broker Name",
    receiptHistory: "Recent Receipts",
    historyFilters: "History Filters",
    historySearch: "Search history...",
    filterDateFrom: "From Date",
    filterDateTo: "To Date",
    filterGrain: "Grain",
    filterBuyer: "Buyer",
    filterSeller: "Seller",
    filterMinRate: "Min Rate",
    filterMaxRate: "Max Rate",
    quickToday: "Today",
    quickThisWeek: "This Week",
    quickThisMonth: "This Month",
    sortHistory: "Sort History",
    sortLatest: "Latest",
    sortOldest: "Oldest",
    sortAmount: "Amount",
    sortRate: "Rate",
    sortBuyer: "Buyer",
    sortSeller: "Seller",
    loadReceipt: "Load",
    editHistoryItem: "Edit",
    duplicateReceipt: "Duplicate",
    duplicateClearWeights: "Duplicate Clear Weights",
    deleteHistoryItem: "Delete",
    confirmDeleteHistoryItem: "Delete this history item?",
    lockReceipt: "Lock",
    unlockReceipt: "Unlock",
    clearHistory: "Clear History",
    exportHistoryCsv: "Export CSV",
    backupData: "Backup JSON",
    restoreData: "Restore JSON",
    exportSettlementCsv: "Settlement CSV",
    settlementPdf: "Settlement PDF",
    simpleWhatsappText: "Simple WhatsApp",
    stickyGenerate: "Generate",
    stickySettlement: "Settlement",
    stickyPrint: "Print",
    settlementTitle: "Final Settlement",
    settlementName: "Settlement Name",
    settlementNote: "Settlement Note",
    previousBalance: "Previous Balance",
    cashPaid: "Cash Paid",
    roundingAdjustment: "Rounding Adjustment",
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
    bulkSelectFiltered: "Select Filtered",
    buyerWiseTotals: "Buyer-wise Totals",
    sellerWiseTotals: "Seller-wise Totals",
    grainWiseBreakdown: "Grain-wise Breakdown",
    finalCollection: "Final Collection",
    ledgerView: "Party Ledger",
    runningBalance: "Running Balance",
    analytics: "Analytics",
    topGrains: "Top Grains",
    topBuyers: "Top Buyers",
    topSellers: "Top Sellers",
    averageRate: "Average Rate",
    printTemplate: "Print Template",
    printTemplateStandard: "Standard",
    printTemplateCompact: "Compact",
    printTemplateLedger: "Ledger",
    noSettlementReceipts: "Select at least one receipt for selected party.",
    bulkWeightLabel: "Quick Paste Weights (space-separated)",
    bulkWeightPlaceholder: "Example: 58.9 61.4 60 62.5",
    clearWeights: "Clear Weights",
    undoLastWeight: "Undo Last Weight",
    clearRow: "Clear Row",
    clearColumn: "Clear Column",
    weightInputModeLabel: "Weight Input",
    singleRowMode: "List",
    tableMode: "Table",
    settlementShowWeights: "Show Weights In Settlement",
    rows: "Rows",
    columns: "Columns",
    weightGridHint:
      "Enter moves down first, then to the top of the next column. Arrow keys work on desktop.",
    savedDefaults: "Saved Defaults",
    useSavedDefaults: "Use Saved Defaults",
    defaultsSaved: "Party defaults saved",
    suspiciousValues: "Check These Values",
    warningHighRate: "Rate looks very high. Please confirm it once.",
    warningHighWeight: "One or more weights look unusually high.",
    warningNegativeNet: "Net weight is negative. Please check reduction and weights.",
    warningHighPalledari:
      "Palledari looks high. Please confirm it once.",
    statusDraft: "Draft",
    statusFinal: "Final",
    statusSettled: "Settled",
    statusPaid: "Paid",
    tagCash: "cash",
    tagUdhaar: "udhaar",
    tagPending: "pending",
    tagSample: "sample",
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
    language: "Language",
    slipNumber: "Slip Number",
    date: "Date",
    buyer: "Buyer",
    seller: "Seller",
    grain: "Anaj",
    rate: "Rate (₹ / Kg)",
    reduction: "Katoti (Kg / bori)",
    palledari: "Palledari (₹ / bori)",
    commission: "Commission",
    bori: "Bori",
    weights: "Weight",
    totalWeight: "Total Weight",
    reducedWeight: "Katoti Weight",
    netWeight: "Net Weight",
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
    recentBuyers: "Recent Buyers",
    recentSellers: "Recent Sellers",
    recentGrains: "Recent Anaj",
    favoriteBuyers: "Favorite Buyers",
    favoriteSellers: "Favorite Sellers",
    favoriteGrains: "Favorite Anaj",
    pin: "Pin",
    unpin: "Unpin",
    clearDraft: "Draft Saaf Karo",
    undoClearDraft: "Undo Clear",
    draftReady: "Draft auto-save hai",
    autoSaveCurrentReceipt: "Current Receipt Auto Save",
    restoreLastReceipt: "Pichhli Receipt Wapas Lao",
    restoreLastReceiptEmpty: "Abhi koi pichhli receipt save nahi hai.",
    receiptStatus: "Receipt Status",
    receiptTags: "Receipt Tags",
    customNotes: "Notes",
    truckNumber: "Truck Number",
    quality: "Quality",
    moisture: "Moisture",
    brokerName: "Broker Name",
    receiptHistory: "Pichhli Receipts",
    historyFilters: "History Filters",
    historySearch: "History search...",
    filterDateFrom: "From Date",
    filterDateTo: "To Date",
    filterGrain: "Anaj",
    filterBuyer: "Buyer",
    filterSeller: "Seller",
    filterMinRate: "Min Rate",
    filterMaxRate: "Max Rate",
    quickToday: "Aaj",
    quickThisWeek: "Is Hafte",
    quickThisMonth: "Is Mahine",
    sortHistory: "Sort History",
    sortLatest: "Latest",
    sortOldest: "Oldest",
    sortAmount: "Amount",
    sortRate: "Rate",
    sortBuyer: "Buyer",
    sortSeller: "Seller",
    loadReceipt: "Load",
    editHistoryItem: "Edit",
    duplicateReceipt: "Duplicate",
    duplicateClearWeights: "Duplicate Clear Weights",
    deleteHistoryItem: "Delete",
    confirmDeleteHistoryItem: "Is history item ko delete karein?",
    lockReceipt: "Lock",
    unlockReceipt: "Unlock",
    clearHistory: "History Saaf",
    exportHistoryCsv: "CSV Export",
    backupData: "Backup JSON",
    restoreData: "Restore JSON",
    exportSettlementCsv: "Settlement CSV",
    settlementPdf: "Settlement PDF",
    simpleWhatsappText: "Simple WhatsApp",
    stickyGenerate: "Banao",
    stickySettlement: "Settlement",
    stickyPrint: "Print",
    settlementTitle: "Final Settlement",
    settlementName: "Settlement Name",
    settlementNote: "Settlement Note",
    previousBalance: "Pichhla Balance",
    cashPaid: "Cash Paid",
    roundingAdjustment: "Rounding Adjustment",
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
    bulkSelectFiltered: "Filtered Chune",
    buyerWiseTotals: "Buyer-wise Total",
    sellerWiseTotals: "Seller-wise Total",
    grainWiseBreakdown: "Anaj-wise Breakdown",
    finalCollection: "Final Jama",
    ledgerView: "Party Ledger",
    runningBalance: "Running Balance",
    analytics: "Analytics",
    topGrains: "Top Anaj",
    topBuyers: "Top Buyers",
    topSellers: "Top Sellers",
    averageRate: "Average Rate",
    printTemplate: "Print Template",
    printTemplateStandard: "Standard",
    printTemplateCompact: "Compact",
    printTemplateLedger: "Ledger",
    noSettlementReceipts: "Selected party ki kam se kam ek receipt chune.",
    bulkWeightLabel: "Jaldi Paste Weight (space-separated)",
    bulkWeightPlaceholder: "Udaharan: 58.9 61.4 60 62.5",
    clearWeights: "Weight Saaf Karo",
    undoLastWeight: "Last Weight Undo",
    clearRow: "Row Saaf",
    clearColumn: "Column Saaf",
    weightInputModeLabel: "Weight Input",
    singleRowMode: "List",
    tableMode: "Table",
    settlementShowWeights: "Settlement Mein Weight Dikhao",
    rows: "Rows",
    columns: "Columns",
    weightGridHint:
      "Enter pehle neeche le jayega, phir agle column ke upar. Desktop par arrow keys bhi kaam karengi.",
    savedDefaults: "Saved Defaults",
    useSavedDefaults: "Saved Defaults Lagao",
    defaultsSaved: "Party defaults save ho gaye",
    suspiciousValues: "In Values Ko Check Karein",
    warningHighRate: "Rate zyada lag raha hai. Ek baar check kar lo.",
    warningHighWeight: "Kuch weights kaafi zyada lag rahe hain.",
    warningNegativeNet:
      "Net weight negative aa raha hai. Weight aur katoti check karo.",
    warningHighPalledari:
      "Palledari zyada lag rahi hai. Ek baar confirm kar lo.",
    statusDraft: "Draft",
    statusFinal: "Final",
    statusSettled: "Settled",
    statusPaid: "Paid",
    tagCash: "cash",
    tagUdhaar: "udhaar",
    tagPending: "pending",
    tagSample: "sample",
    formErrors: {
      required: "Yeh field zaroori hai.",
      invalidNumber: "Sahi number dalo.",
      positiveNumber: "Zero se bada number dalo.",
      minOneWeight: "Kam se kam ek sahi wajan dalo.",
    },
  },
};

export const getTodayDate = (): string => new Date().toISOString().slice(0, 10);

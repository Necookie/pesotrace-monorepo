import type {
  TransactionDirection,
  TransactionStatus,
  TransactionSource,
  TransactionCategory,
  ProfileRole,
  CreditEntryType,
} from "@/lib/database.types";

export type AdminTransactionFilterParams = {
  q?: string;
  storeId?: string;
  createdBy?: string;
  direction?: TransactionDirection;
  category?: TransactionCategory;
  status?: TransactionStatus;
  sourceType?: TransactionSource;
  dateRange?: "today" | "7d" | "30d" | "90d" | "all" | "custom";
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: "occurred_at" | "amount" | "fee_computed" | "created_at";
  sortDir?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export type AdminTransactionRow = {
  id: string;
  storeId: string;
  storeName: string;
  direction: TransactionDirection;
  category: TransactionCategory;
  amount: number;
  refNumber: string;
  counterpartyNumber: string | null;
  counterpartyName: string | null;
  occurredAt: string;
  status: TransactionStatus;
  feeComputed: number;
  sourceType: TransactionSource;
  sourceFileUrl: string | null;
  confidence: number | null;
  notes: string | null;
  tags: string[];
  createdBy: string | null;
  creatorName: string | null;
  createdAt: string;
  receiptUrl: string | null;
};

export type AdminTransactionStats = {
  totalCount: number;
  totalVolume: number;
  totalFees: number;
  avgAmount: number;
  confirmedCount: number;
  needsReviewCount: number;
  confirmedRatePct: number;
  byDirection: {
    sendCount: number;
    sendVolume: number;
    receiveCount: number;
    receiveVolume: number;
  };
  byCategory: Record<
    TransactionCategory,
    {
      count: number;
      volume: number;
      fee: number;
    }
  >;
  bySourceType: Record<
    TransactionSource,
    {
      count: number;
      volume: number;
    }
  >;
  volumeTrend: {
    date: string;
    label: string;
    volume: number;
    count: number;
    fee: number;
  }[];
};

export type AdminUserRow = {
  userId: string;
  fullName: string | null;
  role: ProfileRole;
  storeId: string;
  storeName: string;
  isPlatformAdmin: boolean;
  createdAt: string;
  totalTransactionsCreated: number;
  totalVolumeProcessed: number;
  totalFeesGenerated: number;
  lastActiveAt: string | null;
  extractionsConsumed: number;
  creditsConsumed: number;
};

export type AdminUserStats = {
  totalUsers: number;
  totalOwners: number;
  totalManagers: number;
  totalStaff: number;
  totalPlatformAdmins: number;
  activeUsers30d: number;
  activeUsers7d: number;
  topUsersByVolume: {
    userId: string;
    fullName: string | null;
    storeName: string;
    volume: number;
    transactionCount: number;
  }[];
};

export type AdminUserDetailData = {
  user: {
    id: string;
    fullName: string | null;
    role: ProfileRole;
    storeId: string;
    storeName: string;
    isPlatformAdmin: boolean;
    createdAt: string;
  };
  stats: {
    totalTransactions: number;
    totalVolume: number;
    totalFees: number;
    avgAmount: number;
    confirmedCount: number;
    needsReviewCount: number;
    confirmedRatePct: number;
    lastActiveAt: string | null;
    extractionsCount: number;
    creditsUsed: number;
    costUsd: number;
  };
  byCategory: Record<TransactionCategory, { count: number; volume: number }>;
  byDirection: { sendCount: number; sendVolume: number; receiveCount: number; receiveVolume: number };
  bySourceType: Record<TransactionSource, { count: number; volume: number }>;
  activityTrend: {
    date: string;
    label: string;
    volume: number;
    count: number;
  }[];
  recentTransactions: AdminTransactionRow[];
  recentExtractions: {
    id: string;
    entryType: CreditEntryType;
    creditDelta: number;
    costUsd: number;
    sourceType: TransactionSource | null;
    note: string | null;
    createdAt: string;
  }[];
};

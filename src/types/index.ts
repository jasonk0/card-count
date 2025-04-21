export interface MemberCard {
  id: string;
  name: string;
  type: string;
  totalDays: number;
  remainingDays: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  pauseHistory: PauseRecord[];
  price?: number;
  expectedPricePerUse?: number;
}

export interface PauseRecord {
  id: string;
  startDate: string;
  endDate: string | null;
  reason: string;
}

export interface UsageRecord {
  id: string;
  cardId: string;
  date: string;
  isUsed: boolean;
  isSold: boolean;
  soldPrice: number | null;
  notes: string;
}

export interface DashboardStats {
  totalCards: number;
  activeCards: number;
  totalUsage: number;
  averageCostPerUse: number;
} 
import { Sport } from './scan';

export interface CollectionCard {
  id: string;
  userId: string;
  cardResultId?: string;
  playerName: string;
  cardYear: string;
  cardSet: string;
  cardNumber: string;
  sport: Sport;
  manufacturer: string;
  estimatedValueLow: number;
  estimatedValueHigh: number;
  psaGrade?: number;
  imagePath?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CollectionStats {
  totalCards: number;
  totalValueLow: number;
  totalValueHigh: number;
  sportBreakdown: Record<Sport, number>;
}

export interface CollectionFilters {
  sport?: Sport;
  search?: string;
  sortBy?: 'name' | 'value' | 'date' | 'sport';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

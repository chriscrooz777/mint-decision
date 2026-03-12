export type Sport = 'MLB' | 'NBA' | 'NFL' | 'NHL' | 'golf' | 'pokemon' | 'soccer' | 'other';
export type PSARecommendation = 'yes' | 'no' | 'maybe';
export type Confidence = 'high' | 'medium' | 'low';
export type ScanType = 'multi' | 'single';
export type ScanStatus = 'processing' | 'completed' | 'failed';

export interface GridPosition {
  gridRow: number;  // 0-indexed row position
  gridCol: number;  // 0-indexed column position
}

export interface GridLayout {
  gridRows: number;  // total rows in the grid
  gridCols: number;  // total columns in the grid
}

export interface CardResult {
  id: string;
  mintId: number;
  scanId: string;
  cardIndex: number;
  playerName: string;
  cardYear: string;
  cardSet: string;
  cardNumber: string;
  sport: Sport;
  manufacturer: string;
  conditionSummary: string;
  rawPriceLow: number;
  rawPriceHigh: number;
  psaRecommendation: PSARecommendation;
  psaRecommendationReason?: string;
  confidence: Confidence;
  gridPosition?: GridPosition;
  createdAt: string;
}

export interface GradingDetail {
  score: number;
  notes: string;
}

export interface SingleCardResult {
  id: string;
  mintId: number;
  scanId: string;
  playerName: string;
  cardYear: string;
  cardSet: string;
  cardNumber: string;
  sport: Sport;
  manufacturer: string;
  rawPriceLow: number;
  rawPriceHigh: number;
  centering: GradingDetail;
  corners: GradingDetail;
  edges: GradingDetail;
  surface: GradingDetail;
  estimatedPsaGradeLow: number;
  estimatedPsaGradeHigh: number;
  gradingExplanation: string;
  gradeImprovementTips: string;
  gradedValueLow?: number;
  gradedValueHigh?: number;
  createdAt: string;
}

export interface Scan {
  id: string;
  userId: string;
  scanType: ScanType;
  imageFrontPath: string;
  imageBackPath?: string;
  cardCount: number;
  status: ScanStatus;
  createdAt: string;
}

export interface MultiScanResponse {
  scanId: string;
  gridLayout: GridLayout;
  cards: CardResult[];
}

export interface SingleScanResponse {
  scanId: string;
  card: SingleCardResult;
}

export interface WhyExplanationResponse {
  explanation: string;
}

// OpenAI structured output types (raw from API)
export interface AIMultiCardResult {
  card_index: number;
  grid_row: number;
  grid_col: number;
  player_name: string;
  card_year: string;
  card_set: string;
  card_number: string;
  sport: Sport;
  manufacturer: string;
  condition_summary: string;
  raw_price_low: number;
  raw_price_high: number;
  psa_recommendation: PSARecommendation;
  confidence: Confidence;
}

export interface AIMultiScanResponse {
  grid_rows: number;
  grid_cols: number;
  cards: AIMultiCardResult[];
}

export interface AISingleCardResult {
  player_name: string;
  card_year: string;
  card_set: string;
  card_number: string;
  sport: Sport;
  manufacturer: string;
  centering_score: number;
  centering_notes: string;
  corners_score: number;
  corners_notes: string;
  edges_score: number;
  edges_notes: string;
  surface_score: number;
  surface_notes: string;
  estimated_psa_grade_low: number;
  estimated_psa_grade_high: number;
  grading_explanation: string;
  grade_improvement_tips: string;
  raw_price_low: number;
  raw_price_high: number;
  graded_value_low: number;
  graded_value_high: number;
}

export interface AISingleScanResponse {
  card: AISingleCardResult;
}

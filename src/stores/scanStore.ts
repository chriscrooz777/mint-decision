import { create } from 'zustand';
import { CardResult, SingleCardResult, GridLayout } from '@/types/scan';

interface ScanState {
  // Multi-card scan
  isScanning: boolean;
  currentScanId: string | null;
  multiResults: CardResult[] | null;
  gridLayout: GridLayout | null;
  originalImageDataUrl: string | null;

  // Single card scan
  singleResult: SingleCardResult | null;

  // Error state
  error: string | null;

  // Actions
  startScan: () => void;
  setMultiResults: (scanId: string, results: CardResult[], gridLayout: GridLayout, imageDataUrl?: string) => void;
  setSingleResult: (scanId: string, result: SingleCardResult) => void;
  setScanError: (error: string) => void;
  updateCardExplanation: (cardId: string, explanation: string) => void;
  reset: () => void;
}

export const useScanStore = create<ScanState>((set) => ({
  isScanning: false,
  currentScanId: null,
  multiResults: null,
  gridLayout: null,
  originalImageDataUrl: null,
  singleResult: null,
  error: null,

  startScan: () =>
    set({
      isScanning: true,
      multiResults: null,
      gridLayout: null,
      originalImageDataUrl: null,
      singleResult: null,
      error: null,
    }),

  setMultiResults: (scanId, results, gridLayout, imageDataUrl) =>
    set({
      isScanning: false,
      currentScanId: scanId,
      multiResults: results,
      gridLayout,
      originalImageDataUrl: imageDataUrl || null,
    }),

  setSingleResult: (scanId, result) =>
    set({
      isScanning: false,
      currentScanId: scanId,
      singleResult: result,
    }),

  setScanError: (error) =>
    set({ isScanning: false, error }),

  updateCardExplanation: (cardId, explanation) =>
    set((state) => ({
      multiResults: state.multiResults?.map((card) =>
        card.id === cardId
          ? { ...card, psaRecommendationReason: explanation }
          : card
      ) ?? null,
    })),

  reset: () =>
    set({
      isScanning: false,
      currentScanId: null,
      multiResults: null,
      gridLayout: null,
      originalImageDataUrl: null,
      singleResult: null,
      error: null,
    }),
}));

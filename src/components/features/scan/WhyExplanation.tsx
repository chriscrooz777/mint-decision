'use client';

import { useState, useEffect } from 'react';
import { CardResult } from '@/types/scan';
import { useScanStore } from '@/stores/scanStore';

interface WhyExplanationProps {
  card: CardResult;
}

export default function WhyExplanation({ card }: WhyExplanationProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState(card.psaRecommendationReason || '');
  const updateCardExplanation = useScanStore((s) => s.updateCardExplanation);

  useEffect(() => {
    if (explanation || isLoading) return;

    async function fetchExplanation() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/scan/${card.scanId}/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cardResultId: card.id }),
        });

        if (!res.ok) throw new Error('Failed to get explanation');

        const data = await res.json();
        setExplanation(data.explanation);
        updateCardExplanation(card.id, data.explanation);
      } catch {
        setExplanation('Unable to load explanation. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchExplanation();
  }, [card.id, card.scanId, explanation, isLoading, updateCardExplanation]);

  if (isLoading) {
    return (
      <div className="bg-muted-light rounded-xl p-3 animate-pulse">
        <div className="h-3 bg-border rounded w-3/4 mb-2" />
        <div className="h-3 bg-border rounded w-1/2" />
      </div>
    );
  }

  return (
    <div className="bg-muted-light rounded-xl p-3">
      <p className="text-xs text-foreground leading-relaxed">{explanation}</p>
    </div>
  );
}

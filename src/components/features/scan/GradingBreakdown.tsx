'use client';

import { GradingDetail } from '@/types/scan';

interface GradingBreakdownProps {
  centering: GradingDetail;
  corners: GradingDetail;
  edges: GradingDetail;
  surface: GradingDetail;
  hideTitle?: boolean;
}

export default function GradingBreakdown({
  centering,
  corners,
  edges,
  surface,
  hideTitle,
}: GradingBreakdownProps) {
  const categories = [
    { label: 'Centering', ...centering },
    { label: 'Corners', ...corners },
    { label: 'Edges', ...edges },
    { label: 'Surface', ...surface },
  ];

  return (
    <div className="space-y-3">
      {!hideTitle && <h3 className="font-bold text-sm">Grading Breakdown</h3>}
      {categories.map((cat) => (
        <GradeBar key={cat.label} label={cat.label} score={cat.score} notes={cat.notes} />
      ))}
    </div>
  );
}

function GradeBar({
  label,
  score,
  notes,
}: {
  label: string;
  score: number;
  notes: string;
}) {
  const percentage = (score / 10) * 100;
  const color = getScoreColor(score);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold">{label}</span>
        <span className={`text-xs font-bold ${color}`}>{score.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-muted-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-muted leading-relaxed">{notes}</p>
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 9) return 'text-emerald-600';
  if (score >= 7) return 'text-blue-600';
  if (score >= 5) return 'text-amber-600';
  return 'text-red-600';
}

function getBarColor(score: number): string {
  if (score >= 9) return 'bg-emerald-500';
  if (score >= 7) return 'bg-blue-500';
  if (score >= 5) return 'bg-amber-500';
  return 'bg-red-500';
}

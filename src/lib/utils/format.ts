export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPriceRange(low: number, high: number): string {
  if (low === high) return formatCurrency(low);
  return `${formatCurrency(low)} - ${formatCurrency(high)}`;
}

export function formatGrade(grade: number): string {
  return grade.toFixed(1);
}

export function formatGradeRange(low: number, high: number): string {
  if (low === high) return `PSA ${formatGrade(low)}`;
  return `PSA ${formatGrade(low)} - ${formatGrade(high)}`;
}

export function getCurrentMonthYear(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat('en-US').format(num);
}

export function formatMintId(mintId: number): string {
  // Base-36 encoding (0-9, A-Z) — 6 chars supports 2.1B+ unique IDs
  return `MINT-${mintId.toString(36).toUpperCase().padStart(6, '0')}`;
}

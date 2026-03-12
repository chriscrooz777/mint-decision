'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function ResultsPage() {
  const params = useParams();
  const scanId = params.scanId as string;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Scan Results</h1>
      <p className="text-muted text-sm">
        Scan ID: {scanId}
      </p>
      <p className="text-sm text-muted">
        Results are shown after scanning. Visit the scan page to start a new evaluation.
      </p>
      <Link
        href="/scan"
        className="inline-block text-sm text-primary font-semibold hover:underline"
      >
        ← Back to Scan
      </Link>
    </div>
  );
}

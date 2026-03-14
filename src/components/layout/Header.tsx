'use client';

import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

export default function Header() {
  return (
    <header className="sticky top-0 z-40 bg-card/80 backdrop-blur-md border-b border-border">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/scan" className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/mint-logo2.png" alt="Mint Decision" className="w-8 h-8 object-contain" />
          <span className="text-lg font-bold tracking-tight">{APP_NAME}</span>
        </Link>

        <Link
          href="/account"
          className="p-2 rounded-xl hover:bg-muted-light text-muted"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      </div>
    </header>
  );
}

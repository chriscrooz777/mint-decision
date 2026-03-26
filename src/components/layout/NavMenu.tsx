'use client';

import { useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { APP_NAME } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';

const navItems = [
  {
    href: '/scan',
    label: 'Scan',
    description: 'Scan & identify cards',
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    href: '/collection',
    label: 'Collection',
    description: 'Your saved cards',
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />
      </svg>
    ),
  },
  {
    href: '/pricing',
    label: 'Pricing',
    description: 'Plans & upgrades',
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted'}`}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    href: '/account',
    label: 'Account',
    description: 'Profile & settings',
    icon: (active: boolean) => (
      <svg
        className={`w-5 h-5 ${active ? 'text-primary' : 'text-muted'}`}
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
    ),
  },
];

interface NavMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NavMenu({ isOpen, onClose }: NavMenuProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSignOut = useCallback(async () => {
    onClose();
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }, [onClose, router]);

  return (
    <>
      {/* Backdrop */}
      <div
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, right drawer on md+ */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className={[
          'fixed z-50',
          'bg-[#070d1a] border-border',
          'transition-transform duration-300 ease-out',
          // Mobile: bottom sheet — slides up from bottom
          'bottom-0 left-0 right-0 rounded-t-3xl border-t',
          // Desktop: right drawer — slides in from right; reset y so only x animates
          'md:bottom-auto md:top-0 md:left-auto md:right-0 md:h-full md:w-80',
          'md:rounded-none md:rounded-l-2xl md:border-t-0 md:border-l',
          // Open/closed: mobile uses translateY, desktop uses translateX (y reset to 0)
          isOpen
            ? 'translate-y-0 md:translate-y-0 md:translate-x-0 pointer-events-auto'
            : 'translate-y-full md:translate-y-0 md:translate-x-full pointer-events-none',
        ].join(' ')}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/mint-logo2.png" alt="" className="w-7 h-7 object-contain" />
            <span className="font-bold text-sm tracking-tight">{APP_NAME}</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/5 text-muted hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Nav items */}
        <nav className="px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl transition-colors group ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted hover:bg-white/5 hover:text-foreground'
                }`}
              >
                {/* Icon container */}
                <div
                  className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                    isActive
                      ? 'bg-primary/15'
                      : 'bg-white/5 group-hover:bg-white/8'
                  }`}
                >
                  {item.icon(isActive)}
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold leading-none mb-0.5 text-foreground">
                    {item.label}
                  </div>
                  <div className="text-xs text-muted leading-none">
                    {item.description}
                  </div>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sign Out */}
        <div className="px-3 pb-8 md:pb-6 border-t border-border mt-2 pt-3">
          <button
            onClick={handleSignOut}
            className="flex items-center gap-3.5 w-full px-3 py-3 rounded-xl text-muted hover:bg-white/5 hover:text-red-400 transition-colors group"
          >
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white/5 group-hover:bg-red-950/30 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold leading-none mb-0.5 text-foreground group-hover:text-red-400 transition-colors">
                Sign Out
              </div>
              <div className="text-xs text-muted leading-none">
                Sign out of your account
              </div>
            </div>
          </button>
        </div>
      </div>
    </>
  );
}

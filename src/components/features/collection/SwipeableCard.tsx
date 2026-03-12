'use client';

import { useRef, useState, useCallback, useEffect } from 'react';

interface SwipeableCardProps {
  children: React.ReactNode;
  onDelete: () => Promise<void>;
  onTap?: () => void;
  cardId: string;
}

const DIRECTION_LOCK_THRESHOLD = 10; // px to determine swipe vs scroll
const DELETE_THRESHOLD_PERCENT = 0.35; // 35% of card width triggers delete
const TAP_MOVE_TOLERANCE = 8; // px — movement within this is still a tap

export default function SwipeableCard({ children, onDelete, onTap, cardId }: SwipeableCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [deltaX, setDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  // Refs for gesture tracking (avoid re-renders during movement)
  const startXRef = useRef(0);
  const startYRef = useRef(0);
  const isHorizontalRef = useRef<boolean | null>(null);
  const isActiveRef = useRef(false);
  const deltaXRef = useRef(0);
  const didMoveRef = useRef(false); // Any significant movement at all

  const getCardWidth = useCallback(() => {
    return cardRef.current?.offsetWidth || 300;
  }, []);

  const handleStart = useCallback((clientX: number, clientY: number) => {
    if (isDeleting) return;
    startXRef.current = clientX;
    startYRef.current = clientY;
    isHorizontalRef.current = null;
    isActiveRef.current = true;
    deltaXRef.current = 0;
    didMoveRef.current = false;
    setIsSwiping(true);
  }, [isDeleting]);

  const handleMove = useCallback((clientX: number, clientY: number, preventDefault?: () => void) => {
    if (!isActiveRef.current || isDeleting) return;

    const dx = clientX - startXRef.current;
    const dy = clientY - startYRef.current;

    // Track if finger moved beyond tap tolerance
    if (Math.abs(dx) > TAP_MOVE_TOLERANCE || Math.abs(dy) > TAP_MOVE_TOLERANCE) {
      didMoveRef.current = true;
    }

    // Determine direction on first significant movement
    if (isHorizontalRef.current === null) {
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (absX + absY < DIRECTION_LOCK_THRESHOLD) return;

      if (absX > absY) {
        isHorizontalRef.current = true;
        preventDefault?.();
      } else {
        isHorizontalRef.current = false;
        isActiveRef.current = false;
        setIsSwiping(false);
        return;
      }
    }

    if (!isHorizontalRef.current) return;

    preventDefault?.();

    // Only allow left swipe (negative values)
    const clampedDx = Math.min(0, dx);
    deltaXRef.current = clampedDx;
    setDeltaX(clampedDx);
  }, [isDeleting]);

  const handleEnd = useCallback(() => {
    if (!isActiveRef.current) return;
    isActiveRef.current = false;

    const cardWidth = getCardWidth();
    const currentDelta = deltaXRef.current;
    const wasTap = !didMoveRef.current;

    // Check if past delete threshold
    if (Math.abs(currentDelta) > cardWidth * DELETE_THRESHOLD_PERCENT) {
      // Trigger delete animation
      setIsDeleting(true);
      setDeltaX(-cardWidth - 20); // Slide fully off screen

      // After slide animation, collapse height
      setTimeout(() => {
        setIsRemoved(true);
        // After height collapse, call delete
        setTimeout(async () => {
          try {
            await onDelete();
          } catch {
            // Reset on failure
            setIsDeleting(false);
            setIsRemoved(false);
            setDeltaX(0);
          }
        }, 300);
      }, 300);
    } else {
      // Snap back
      setDeltaX(0);

      // If no significant movement occurred, this was a tap
      if (wasTap && onTap) {
        onTap();
      }
    }

    setIsSwiping(false);
  }, [getCardWidth, onDelete, onTap]);

  // Touch event listeners (non-passive for preventDefault)
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleStart(touch.clientX, touch.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0];
      handleMove(touch.clientX, touch.clientY, () => e.preventDefault());
    };

    const handleTouchEnd = () => {
      handleEnd();
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: false });
    el.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleStart, handleMove, handleEnd]);

  // Mouse event handlers (for desktop testing)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY);

    const handleMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      handleEnd();
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [handleStart, handleMove, handleEnd]);

  // Calculate delete background opacity based on swipe progress
  const cardWidth = getCardWidth();
  const progress = Math.min(Math.abs(deltaX) / (cardWidth * DELETE_THRESHOLD_PERCENT), 1);

  const contentStyle: React.CSSProperties = {
    transform: `translateX(${deltaX}px)`,
    transition: isSwiping ? 'none' : 'transform 300ms ease-out',
  };

  const wrapperStyle: React.CSSProperties = {
    maxHeight: isRemoved ? '0px' : '200px',
    opacity: isRemoved ? 0 : 1,
    marginBottom: isRemoved ? '0px' : undefined,
    overflow: 'hidden',
    transition: isRemoved
      ? 'max-height 300ms ease-out, opacity 200ms ease-out, margin-bottom 300ms ease-out'
      : 'none',
  };

  if (isRemoved && !isDeleting) return null;

  return (
    <div
      ref={cardRef}
      style={wrapperStyle}
      className="relative select-none"
      data-card-id={cardId}
    >
      {/* Delete background (revealed as card slides left) */}
      <div
        className="absolute inset-0 bg-red-500 rounded-xl flex items-center justify-end pr-5 gap-2"
        style={{ opacity: Math.min(progress, 1) }}
      >
        <span className="text-white text-xs font-bold">Delete</span>
        <svg
          className="w-5 h-5 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </div>

      {/* Card content (slides with swipe) */}
      <div
        style={contentStyle}
        onMouseDown={handleMouseDown}
        className="relative z-10"
      >
        {children}
      </div>
    </div>
  );
}

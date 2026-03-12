'use client';

import { useEffect, useRef, useState } from 'react';
import { GridLayout, GridPosition } from '@/types/scan';

interface CroppedCardThumbnailProps {
  imageDataUrl: string;
  gridLayout: GridLayout;
  gridPosition: GridPosition;
  alt: string;
}

export default function CroppedCardThumbnail({
  imageDataUrl,
  gridLayout,
  gridPosition,
  alt,
}: CroppedCardThumbnailProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [croppedUrl, setCroppedUrl] = useState<string | null>(null);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      // Calculate cell dimensions from grid layout
      const cellWidth = img.naturalWidth / gridLayout.gridCols;
      const cellHeight = img.naturalHeight / gridLayout.gridRows;

      // Calculate this card's position in the grid
      const baseX = gridPosition.gridCol * cellWidth;
      const baseY = gridPosition.gridRow * cellHeight;

      // Add inward padding (5%) to avoid capturing edges of neighboring cards
      const padX = cellWidth * 0.05;
      const padY = cellHeight * 0.05;

      const cropX = baseX + padX;
      const cropY = baseY + padY;
      const cropW = cellWidth - padX * 2;
      const cropH = cellHeight - padY * 2;

      // Clamp to image bounds
      const finalX = Math.max(0, cropX);
      const finalY = Math.max(0, cropY);
      const finalW = Math.min(img.naturalWidth - finalX, cropW);
      const finalH = Math.min(img.naturalHeight - finalY, cropH);

      // Set canvas to thumbnail size (maintain aspect ratio)
      const maxSize = 200;
      const aspectRatio = finalW / finalH;
      let canvasW, canvasH;

      if (aspectRatio > 1) {
        canvasW = maxSize;
        canvasH = maxSize / aspectRatio;
      } else {
        canvasH = maxSize;
        canvasW = maxSize * aspectRatio;
      }

      canvas.width = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw the cropped region
      ctx.drawImage(
        img,
        finalX,
        finalY,
        finalW,
        finalH,
        0,
        0,
        canvasW,
        canvasH
      );

      setCroppedUrl(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = imageDataUrl;
  }, [imageDataUrl, gridLayout, gridPosition]);

  return (
    <>
      <canvas ref={canvasRef} className="hidden" />
      {croppedUrl ? (
        <img
          src={croppedUrl}
          alt={alt}
          className="w-16 h-22 object-cover rounded-lg border border-border shrink-0"
        />
      ) : (
        <div className="w-16 h-22 bg-muted-light rounded-lg border border-border shrink-0 animate-pulse" />
      )}
    </>
  );
}

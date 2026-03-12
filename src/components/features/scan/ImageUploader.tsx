'use client';

import { useRef, useCallback } from 'react';
import { useImageUpload } from '@/hooks/useImageUpload';

interface ImageUploaderProps {
  label: string;
  hint?: string;
  optional?: boolean;
  onImageReady: (base64: string, mimeType: string) => void;
  onClear?: () => void;
}

export default function ImageUploader({
  label,
  hint,
  optional = false,
  onImageReady,
  onClear,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { preview, isProcessing, error, handleFileSelect, reset } =
    useImageUpload();

  const handleFile = useCallback(
    async (file: File) => {
      await handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // After state update, call onImageReady
  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleFile(file);
    },
    [handleFile]
  );

  // We need to detect when preview becomes available and pass base64 up
  // Using a wrapper component approach
  return (
    <ImageUploaderInner
      label={label}
      hint={hint}
      optional={optional}
      onImageReady={onImageReady}
      onClear={onClear}
    />
  );
}

// Inner component that directly manages state
function ImageUploaderInner({
  label,
  hint,
  optional = false,
  onImageReady,
  onClear,
}: ImageUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const { preview, base64, mimeType, isProcessing, error, handleFileSelect, reset } =
    useImageUpload();

  const processFile = useCallback(
    async (file: File) => {
      await handleFileSelect(file);
    },
    [handleFileSelect]
  );

  // Use effect-like pattern with callback ref would be complex
  // Instead, handle it in the onChange
  const handleInputChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      // Reset the input so the same file can be selected again
      e.target.value = '';

      await processFile(file);
    },
    [processFile]
  );

  // Notify parent when base64 is ready
  if (base64 && mimeType) {
    // Schedule the callback for next tick to avoid setState during render
    setTimeout(() => onImageReady(base64, mimeType), 0);
  }

  const handleClear = () => {
    reset();
    onClear?.();
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  if (preview) {
    return (
      <div className="relative rounded-2xl overflow-hidden border-2 border-primary bg-card">
        <img
          src={preview}
          alt="Card preview"
          className="w-full h-48 object-contain bg-muted-light"
        />
        <button
          onClick={handleClear}
          className="absolute top-2 right-2 w-8 h-8 bg-black/60 text-white rounded-full flex items-center justify-center hover:bg-black/80"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="px-3 py-2 text-xs text-secondary font-semibold flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Image ready
        </div>
      </div>
    );
  }

  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
      className="border-2 border-dashed border-border rounded-2xl p-6 text-center hover:border-primary transition-colors bg-card"
    >
      <div className="mb-3">
        <div className="w-10 h-10 bg-muted-light rounded-xl flex items-center justify-center mx-auto mb-2">
          <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p className="text-sm font-semibold">
          {label}
          {optional && <span className="text-muted font-normal"> (optional)</span>}
        </p>
        {hint && <p className="text-xs text-muted mt-0.5">{hint}</p>}
      </div>

      {isProcessing ? (
        <div className="flex items-center justify-center gap-2 py-2">
          <svg className="animate-spin w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-sm text-muted">Processing image...</span>
        </div>
      ) : (
        <div className="flex gap-2 justify-center">
          {/* Camera button (mobile) */}
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary-dark transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            Camera
          </button>

          {/* File upload button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-4 py-2 bg-muted-light text-foreground text-sm font-semibold rounded-xl hover:bg-border transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Gallery
          </button>
        </div>
      )}

      {error && (
        <p className="text-danger text-xs mt-2">{error}</p>
      )}

      {/* Hidden inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleInputChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={handleInputChange}
        className="hidden"
      />
    </div>
  );
}

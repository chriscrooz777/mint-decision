'use client';

import { useState, useCallback } from 'react';
import { compressImage, fileToBase64, getImageMimeType } from '@/lib/utils/image';

interface UseImageUploadOptions {
  maxSizeMB?: number;
}

interface ImageUploadState {
  file: File | null;
  preview: string | null;
  base64: string | null;
  mimeType: string | null;
  isProcessing: boolean;
  error: string | null;
}

export function useImageUpload(_options?: UseImageUploadOptions) {
  const [state, setState] = useState<ImageUploadState>({
    file: null,
    preview: null,
    base64: null,
    mimeType: null,
    isProcessing: false,
    error: null,
  });

  const handleFileSelect = useCallback(async (file: File) => {
    setState((prev) => ({ ...prev, isProcessing: true, error: null }));

    try {
      // Validate file type
      // Browsers may report HEIC as '', 'application/octet-stream', or 'image/heic'
      const validMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ];
      const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];
      const fileName = file.name.toLowerCase();
      const isValidType =
        validMimeTypes.includes(file.type) ||
        validExtensions.some((ext) => fileName.endsWith(ext));

      if (!isValidType) {
        throw new Error(
          'Please upload a JPEG, PNG, WebP, or HEIC image.'
        );
      }

      // Compress and convert
      const compressed = await compressImage(file);
      const base64 = await fileToBase64(compressed);
      const preview = URL.createObjectURL(compressed);
      const mimeType = getImageMimeType(compressed);

      setState({
        file: compressed,
        preview,
        base64,
        mimeType,
        isProcessing: false,
        error: null,
      });
    } catch (err) {
      let message: string;
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === 'string') {
        message = err;
      } else {
        message = 'Failed to process image. Please try again.';
      }
      setState((prev) => ({
        ...prev,
        isProcessing: false,
        error: message,
      }));
    }
  }, []);

  const reset = useCallback(() => {
    if (state.preview) {
      URL.revokeObjectURL(state.preview);
    }
    setState({
      file: null,
      preview: null,
      base64: null,
      mimeType: null,
      isProcessing: false,
      error: null,
    });
  }, [state.preview]);

  return {
    ...state,
    handleFileSelect,
    reset,
  };
}

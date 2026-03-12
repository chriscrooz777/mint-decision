import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 2,
  maxWidthOrHeight: 2048,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
};

/**
 * Check if a file is HEIC/HEIF format.
 * Browsers may report HEIC type as '', 'image/heic', 'image/heif',
 * or 'application/octet-stream' depending on OS and browser.
 */
function isHeicFile(file: File): boolean {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return (
    type === 'image/heic' ||
    type === 'image/heif' ||
    name.endsWith('.heic') ||
    name.endsWith('.heif')
  );
}

/**
 * Convert HEIC to JPEG using a Canvas fallback.
 * Works in Safari and newer Chrome that can decode HEIC natively.
 */
async function heicToJpegViaCanvas(file: File): Promise<File | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          URL.revokeObjectURL(url);
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        canvas.toBlob(
          (blob) => {
            URL.revokeObjectURL(url);
            if (!blob) {
              resolve(null);
              return;
            }
            const jpegName = file.name.replace(/\.heic$/i, '.jpg').replace(/\.heif$/i, '.jpg');
            resolve(new File([blob], jpegName, { type: 'image/jpeg' }));
          },
          'image/jpeg',
          0.9
        );
      } catch {
        URL.revokeObjectURL(url);
        resolve(null);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    img.src = url;
  });
}

/**
 * Convert HEIC to JPEG using the heic2any library.
 */
async function heicToJpegViaLibrary(file: File): Promise<File | null> {
  try {
    const heic2any = (await import('heic2any')).default;
    const blob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });
    const converted = Array.isArray(blob) ? blob[0] : blob;
    const jpegName = file.name
      .replace(/\.heic$/i, '.jpg')
      .replace(/\.heif$/i, '.jpg');
    return new File([converted], jpegName, { type: 'image/jpeg' });
  } catch {
    return null;
  }
}

/**
 * Convert HEIC to JPEG via server-side sharp.
 * Last resort fallback when client-side methods fail.
 */
async function heicToJpegViaServer(file: File): Promise<File> {
  // Read file as base64
  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const res = await fetch('/api/convert-image', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: base64, mimeType: file.type }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Server-side image conversion failed.');
  }

  const data = await res.json();

  // Convert base64 back to File
  const byteString = atob(data.image);
  const ab = new ArrayBuffer(byteString.length);
  const ia = new Uint8Array(ab);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }
  const blob = new Blob([ab], { type: 'image/jpeg' });
  const jpegName = file.name
    .replace(/\.heic$/i, '.jpg')
    .replace(/\.heif$/i, '.jpg');
  return new File([blob], jpegName, { type: 'image/jpeg' });
}

export async function compressImage(file: File): Promise<File> {
  // Convert HEIC/HEIF to JPEG
  if (isHeicFile(file)) {
    // 1. Try Canvas (Safari & newer Chrome that decode HEIC natively)
    const canvasResult = await heicToJpegViaCanvas(file);
    if (canvasResult) {
      file = canvasResult;
    } else {
      // 2. Try heic2any library (client-side JS decoder)
      const libraryResult = await heicToJpegViaLibrary(file);
      if (libraryResult) {
        file = libraryResult;
      } else {
        // 3. Server-side conversion via sharp (most reliable)
        file = await heicToJpegViaServer(file);
      }
    }
  }

  // Skip compression if already small enough
  if (file.size <= COMPRESSION_OPTIONS.maxSizeMB * 1024 * 1024) {
    return file;
  }

  return await imageCompression(file, COMPRESSION_OPTIONS);
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Remove the data URL prefix (data:image/jpeg;base64,)
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function getImageMimeType(file: File): string {
  const type = file.type;
  if (type === 'image/jpeg' || type === 'image/png' || type === 'image/webp') {
    return type;
  }
  // Default to jpeg
  return 'image/jpeg';
}

/**
 * Crop a single card from a multi-card grid image.
 * Returns a JPEG Blob at ~400px max dimension.
 * Matches the cropping logic in CroppedCardThumbnail exactly
 * (5% inward padding, clamped to image bounds).
 */
export function cropCardFromGrid(
  imageDataUrl: string,
  gridLayout: { gridRows: number; gridCols: number },
  gridPosition: { gridRow: number; gridCol: number },
  maxSize = 400
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');

      const cellWidth = img.naturalWidth / gridLayout.gridCols;
      const cellHeight = img.naturalHeight / gridLayout.gridRows;

      const baseX = gridPosition.gridCol * cellWidth;
      const baseY = gridPosition.gridRow * cellHeight;

      // 5% inward padding to avoid neighbor card edges
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

      // Scale to maxSize maintaining aspect ratio
      const aspectRatio = finalW / finalH;
      let canvasW: number, canvasH: number;
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
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, finalX, finalY, finalW, finalH, 0, 0, canvasW, canvasH);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => reject(new Error('Failed to load image for cropping'));
    img.src = imageDataUrl;
  });
}

/**
 * Convert a base64 data URL directly to a Blob (no resizing).
 * Used for single-card uploads where the image IS the card.
 * The image is already compressed by useImageUpload (≤2MB / 2048px).
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    buffer[i] = bytes.charCodeAt(i);
  }
  return new Blob([buffer], { type: mime });
}

/**
 * Convert a base64 data URL to a resized JPEG Blob.
 * Used for multi-scan grid thumbnails where cards must be cropped.
 */
export function dataUrlToResizedBlob(
  dataUrl: string,
  maxSize = 400
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const aspectRatio = img.naturalWidth / img.naturalHeight;
      let w: number, h: number;
      if (aspectRatio > 1) {
        w = maxSize;
        h = maxSize / aspectRatio;
      } else {
        h = maxSize;
        w = maxSize * aspectRatio;
      }
      canvas.width = w;
      canvas.height = h;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0, w, h);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export const maxDuration = 30;

/**
 * Check if a buffer is a HEIC/HEIF file by inspecting magic bytes.
 * HEIF files have 'ftyp' at offset 4, followed by a brand like 'heic', 'heix', 'mif1', etc.
 */
function isHeicBuffer(buffer: Buffer): boolean {
  if (buffer.length < 12) return false;
  const ftyp = buffer.toString('ascii', 4, 8);
  if (ftyp !== 'ftyp') return false;
  const brand = buffer.toString('ascii', 8, 12);
  return ['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1'].includes(brand);
}

async function convertHeicToJpeg(inputBuffer: Buffer): Promise<Buffer> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const convert = require('heic-convert') as (opts: {
    buffer: Buffer;
    format: string;
    quality: number;
  }) => Promise<Uint8Array>;

  const result = await convert({
    buffer: inputBuffer,
    format: 'JPEG',
    quality: 0.9,
  });

  // result is a Uint8Array — copy into a Buffer
  return Buffer.from(result.buffer, result.byteOffset, result.byteLength);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { image } = body;

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      );
    }

    // Convert base64 to buffer
    const inputBuffer = Buffer.from(image, 'base64');
    let jpegBuffer: Buffer;

    if (isHeicBuffer(inputBuffer)) {
      // Use heic-convert for HEIC files (sharp's macOS build lacks HEVC codec)
      console.log('[convert-image] Detected HEIC, using heic-convert');
      jpegBuffer = await convertHeicToJpeg(inputBuffer);
    } else {
      // Use sharp for all other formats
      console.log('[convert-image] Using sharp for conversion');
      jpegBuffer = await sharp(inputBuffer)
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    // Return as base64
    const jpegBase64 = jpegBuffer.toString('base64');

    return NextResponse.json({
      image: jpegBase64,
      mimeType: 'image/jpeg',
    });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('[convert-image] Error:', errorMsg);
    return NextResponse.json(
      { error: `Image conversion failed: ${errorMsg}` },
      { status: 500 }
    );
  }
}

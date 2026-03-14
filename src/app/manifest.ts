import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mint Decision — AI Card Grading',
    short_name: 'Mint Decision',
    description:
      'AI-powered sports card identification, valuation, and PSA grading recommendations.',
    start_url: '/scan',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#2563eb',
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

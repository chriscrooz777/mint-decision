import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Mint Decision — AI Sports Card Grading & Valuation';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '800px',
            height: '400px',
            background: 'radial-gradient(ellipse, rgba(37,99,235,0.25) 0%, transparent 70%)',
            display: 'flex',
          }}
        />

        {/* Card accent shapes */}
        <div
          style={{
            position: 'absolute',
            top: '60px',
            right: '100px',
            width: '120px',
            height: '168px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.15), rgba(37,99,235,0.05))',
            borderRadius: '12px',
            border: '1px solid rgba(37,99,235,0.2)',
            transform: 'rotate(8deg)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '90px',
            right: '160px',
            width: '110px',
            height: '154px',
            background: 'linear-gradient(135deg, rgba(251,191,36,0.12), rgba(251,191,36,0.04))',
            borderRadius: '12px',
            border: '1px solid rgba(251,191,36,0.15)',
            transform: 'rotate(-4deg)',
            display: 'flex',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '60px',
            left: '100px',
            width: '100px',
            height: '140px',
            background: 'linear-gradient(135deg, rgba(37,99,235,0.12), rgba(37,99,235,0.04))',
            borderRadius: '12px',
            border: '1px solid rgba(37,99,235,0.15)',
            transform: 'rotate(-6deg)',
            display: 'flex',
          }}
        />

        {/* Logo + brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px', marginBottom: '28px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://mintdecision.com'}/mint-logo2.png`}
            alt="Mint Decision"
            width={72}
            height={72}
            style={{ borderRadius: '16px' }}
          />
          <span
            style={{
              fontSize: '38px',
              fontWeight: '700',
              color: '#ffffff',
              letterSpacing: '-0.5px',
            }}
          >
            Mint Decision
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: '56px',
            fontWeight: '800',
            color: '#ffffff',
            textAlign: 'center',
            lineHeight: 1.1,
            maxWidth: '800px',
            marginBottom: '20px',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          AI Sports Card{' '}
          <span style={{ color: '#3b82f6', marginLeft: '14px' }}>Grading</span>
        </div>

        {/* Subheading */}
        <div
          style={{
            fontSize: '24px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '680px',
            lineHeight: 1.4,
            display: 'flex',
          }}
        >
          Instant identification, valuation &amp; PSA recommendations — just take a photo
        </div>

        {/* Feature pills */}
        <div style={{ display: 'flex', gap: '12px', marginTop: '36px' }}>
          {['MLB', 'NBA', 'NFL', 'NHL', 'Pokémon'].map((sport) => (
            <div
              key={sport}
              style={{
                padding: '8px 18px',
                background: 'rgba(37,99,235,0.15)',
                border: '1px solid rgba(37,99,235,0.3)',
                borderRadius: '999px',
                fontSize: '16px',
                fontWeight: '600',
                color: '#93c5fd',
                display: 'flex',
              }}
            >
              {sport}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}

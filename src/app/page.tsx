import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { APP_NAME } from '@/lib/constants';
import ActivityTicker, { ScanItem } from '@/components/features/landing/ActivityTicker';

const SEED_SCANS: ScanItem[] = [
  { id: 'seed-1',  playerName: 'Michael Jordan',   cardYear: '1986', cardSet: 'Fleer',              sport: 'NBA', psaRecommendation: 'PSA 8',  rawPriceLow: 2400,  rawPriceHigh: 3200  },
  { id: 'seed-2',  playerName: 'Ken Griffey Jr.',  cardYear: '1989', cardSet: 'Upper Deck',         sport: 'MLB', psaRecommendation: 'PSA 9',  rawPriceLow: 180,   rawPriceHigh: 240   },
  { id: 'seed-3',  playerName: 'LeBron James',     cardYear: '2003', cardSet: 'Topps Chrome',       sport: 'NBA', psaRecommendation: 'PSA 8',  rawPriceLow: 480,   rawPriceHigh: 650   },
  { id: 'seed-4',  playerName: 'Tom Brady',        cardYear: '2000', cardSet: 'Playoff Contenders', sport: 'NFL', psaRecommendation: 'PSA 7',  rawPriceLow: 3200,  rawPriceHigh: 4800  },
  { id: 'seed-5',  playerName: 'Mickey Mantle',    cardYear: '1952', cardSet: 'Topps',              sport: 'MLB', psaRecommendation: 'PSA 5',  rawPriceLow: 8500,  rawPriceHigh: 12000 },
  { id: 'seed-6',  playerName: 'Wayne Gretzky',    cardYear: '1979', cardSet: 'O-Pee-Chee',         sport: 'NHL', psaRecommendation: 'PSA 6',  rawPriceLow: 1200,  rawPriceHigh: 1800  },
  { id: 'seed-7',  playerName: 'Derek Jeter',      cardYear: '1993', cardSet: 'SP Rookie',          sport: 'MLB', psaRecommendation: 'PSA 8',  rawPriceLow: 320,   rawPriceHigh: 480   },
  { id: 'seed-8',  playerName: 'Luka Doncic',      cardYear: '2018', cardSet: 'Panini Prizm',       sport: 'NBA', psaRecommendation: 'PSA 9',  rawPriceLow: 580,   rawPriceHigh: 780   },
  { id: 'seed-9',  playerName: 'Patrick Mahomes',  cardYear: '2017', cardSet: 'Panini Prizm',       sport: 'NFL', psaRecommendation: 'PSA 9',  rawPriceLow: 220,   rawPriceHigh: 340   },
  { id: 'seed-10', playerName: 'Stephen Curry',    cardYear: '2009', cardSet: 'Upper Deck',         sport: 'NBA', psaRecommendation: 'PSA 8',  rawPriceLow: 680,   rawPriceHigh: 940   },
  { id: 'seed-11', playerName: 'Albert Pujols',    cardYear: '2001', cardSet: 'SP Authentic',       sport: 'MLB', psaRecommendation: 'PSA 9',  rawPriceLow: 340,   rawPriceHigh: 480   },
  { id: 'seed-12', playerName: 'Peyton Manning',   cardYear: '1998', cardSet: 'Score',              sport: 'NFL', psaRecommendation: 'PSA 8',  rawPriceLow: 95,    rawPriceHigh: 145   },
  { id: 'seed-13', playerName: 'Roberto Clemente', cardYear: '1955', cardSet: 'Topps',              sport: 'MLB', psaRecommendation: 'PSA 4',  rawPriceLow: 1800,  rawPriceHigh: 2400  },
  { id: 'seed-14', playerName: 'Nikola Jokic',     cardYear: '2015', cardSet: 'Panini Prizm',       sport: 'NBA', psaRecommendation: 'PSA 9',  rawPriceLow: 140,   rawPriceHigh: 200   },
  { id: 'seed-15', playerName: 'Shohei Ohtani',    cardYear: '2018', cardSet: 'Topps Chrome',       sport: 'MLB', psaRecommendation: 'PSA 10', rawPriceLow: 280,   rawPriceHigh: 420   },
  { id: 'seed-16', playerName: 'Wilt Chamberlain', cardYear: '1961', cardSet: 'Fleer',              sport: 'NBA', psaRecommendation: 'PSA 4',  rawPriceLow: 2200,  rawPriceHigh: 3400  },
  { id: 'seed-17', playerName: 'Joe Montana',      cardYear: '1981', cardSet: 'Topps',              sport: 'NFL', psaRecommendation: 'PSA 8',  rawPriceLow: 580,   rawPriceHigh: 820   },
  { id: 'seed-18', playerName: 'Ichiro Suzuki',    cardYear: '2001', cardSet: 'Topps',              sport: 'MLB', psaRecommendation: 'PSA 9',  rawPriceLow: 120,   rawPriceHigh: 180   },
];

async function getTickerScans(): Promise<ScanItem[]> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await supabase
      .from('card_results')
      .select('id, player_name, card_year, card_set, sport, psa_recommendation, raw_price_low, raw_price_high')
      .not('player_name', 'is', null)
      .neq('player_name', 'unknown')
      .gt('raw_price_low', 0)
      .order('created_at', { ascending: false })
      .limit(20);

    const real: ScanItem[] = (data ?? [])
      .filter((r) =>
        r.player_name &&
        r.player_name !== 'unknown' &&
        r.card_set && r.card_set !== 'unknown' &&
        r.psa_recommendation && /psa/i.test(r.psa_recommendation) &&
        r.raw_price_low >= 5
      )
      .map((r) => ({
        id: r.id,
        playerName: r.player_name,
        cardYear: r.card_year ?? '',
        cardSet: r.card_set ?? '',
        sport: r.sport ?? 'Other',
        psaRecommendation: r.psa_recommendation,
        rawPriceLow: r.raw_price_low,
        rawPriceHigh: r.raw_price_high,
      }));

    return real.length >= 12 ? real : [...real, ...SEED_SCANS.slice(0, 18 - real.length)];
  } catch {
    return SEED_SCANS;
  }
}

export default async function LandingPage() {
  const tickerScans = await getTickerScans();
  return (
    <div className="min-h-screen flex flex-col bg-slate-900 text-white">

      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <span className="font-bold text-white tracking-tight">{APP_NAME}</span>
        </div>
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-300 hover:text-white transition-colors"
        >
          Sign In
        </Link>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center text-center px-6 pt-10 pb-20"
        style={{ background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(37,99,235,0.25) 0%, transparent 70%)' }}
      >

        {/* Headline */}
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight leading-[1.1] mb-5 max-w-xs sm:max-w-sm">
          Know What Your Cards Are Worth
        </h1>
        <p className="text-base text-slate-400 max-w-xs leading-relaxed mb-12">
          Snap a photo and get instant AI-powered identification, real market pricing, and PSA-style grade estimates.
        </p>

        {/* Card stack illustration */}
        <div className="relative h-52 w-48 mb-14 mx-auto select-none" aria-hidden="true">
          {/* Back card */}
          <div className="absolute top-6 left-12 w-36 h-48 bg-blue-900/50 rounded-2xl border border-blue-700/30 shadow-lg"
            style={{ transform: 'rotate(14deg)' }} />
          {/* Middle card */}
          <div className="absolute top-3 left-6 w-36 h-48 bg-blue-800/60 rounded-2xl border border-blue-600/40 shadow-lg"
            style={{ transform: 'rotate(7deg)' }} />
          {/* Front card */}
          <div className="absolute top-0 left-0 w-36 h-48 rounded-2xl border border-blue-400/50 shadow-2xl flex flex-col items-center justify-center gap-3"
            style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-sm tracking-widest text-center">MINT</p>
              <p className="text-blue-200/80 text-xs text-center mt-0.5">PSA Est. 9</p>
            </div>
            <div className="flex gap-1.5 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
              <span className="w-1.5 h-1.5 rounded-full bg-white/30" />
            </div>
          </div>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <Link
            href="/signup"
            className="w-full bg-primary hover:bg-primary-dark text-white text-center font-bold py-4 px-6 rounded-xl shadow-lg transition-colors text-base"
          >
            Get Started Free
          </Link>
          <Link
            href="/login"
            className="w-full text-white/80 hover:text-white text-center font-semibold py-3.5 px-6 rounded-xl border border-white/15 hover:border-white/35 transition-colors text-sm"
          >
            Sign In
          </Link>
        </div>

        <p className="mt-5 text-xs text-slate-600">Free to start — no credit card required</p>
      </main>

      {/* Activity ticker */}
      <ActivityTicker items={tickerScans} />

      {/* Features */}
      <section className="px-6 py-14 bg-slate-800/40">
        <h2 className="text-center text-lg font-bold text-white mb-2">
          Everything in One Scan
        </h2>
        <p className="text-center text-sm text-slate-500 mb-10">
          From photo to valuation in seconds.
        </p>
        <div className="max-w-sm mx-auto space-y-4">
          <FeatureCard
            icon="camera"
            title="Quick Scan"
            description="Identify and value up to 9 cards at once. Save the ones worth keeping track of."
            color="blue"
          />
          <FeatureCard
            icon="shield"
            title="Deep Evaluation"
            description="Centering, corners, edges, and surface — full PSA-style grading with an estimated grade."
            color="emerald"
          />
          <FeatureCard
            icon="dollar"
            title="Real Market Pricing"
            description="Values sourced from eBay sold listings and PSA data, not inflated book prices."
            color="amber"
          />
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-slate-800 px-6 py-8 bg-slate-900">
        <div className="max-w-sm mx-auto flex items-center justify-center gap-6 flex-wrap">
          <TrustPill label="GPT-4o Vision" />
          <TrustPill label="eBay-sourced pricing" />
          <TrustPill label="PSA-style grading" />
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/60 text-center py-6 px-6 bg-slate-900">
        <p className="text-xs text-slate-700">&copy; {new Date().getFullYear()} {APP_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}

const featureIcons: Record<string, React.ReactNode> = {
  camera: (
    <>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </>
  ),
  shield: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  ),
  dollar: (
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75}
      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
};

const colorMap: Record<string, { bg: string; icon: string }> = {
  blue:    { bg: 'bg-blue-500/10',   icon: 'text-blue-400' },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400' },
  amber:   { bg: 'bg-amber-500/10',  icon: 'text-amber-400' },
};

function FeatureCard({
  icon,
  title,
  description,
  color,
}: {
  icon: string;
  title: string;
  description: string;
  color: string;
}) {
  const { bg, icon: iconColor } = colorMap[color] ?? colorMap.blue;
  return (
    <div className="flex gap-4 items-start bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4">
      <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
        <svg className={`w-5 h-5 ${iconColor}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {featureIcons[icon]}
        </svg>
      </div>
      <div>
        <h3 className="font-bold text-sm text-white">{title}</h3>
        <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

function TrustPill({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-slate-500">
      <svg className="w-3.5 h-3.5 text-slate-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
      {label}
    </div>
  );
}

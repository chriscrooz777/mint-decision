import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import ScanCommunityFeed from '@/components/features/scan/ScanCommunityFeed';
import type { ScanItem } from '@/components/features/landing/ActivityTicker';

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
  { id: 'seed-12', playerName: 'Shohei Ohtani',    cardYear: '2018', cardSet: 'Topps Chrome',       sport: 'MLB', psaRecommendation: 'PSA 10', rawPriceLow: 280,   rawPriceHigh: 420   },
];

async function getCommunityData(): Promise<{ items: ScanItem[]; totalToday: number }> {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [scansRes, countRes] = await Promise.all([
      supabase
        .from('card_results')
        .select('id, player_name, card_year, card_set, sport, psa_recommendation, raw_price_low, raw_price_high')
        .not('player_name', 'is', null)
        .neq('player_name', 'unknown')
        .gt('raw_price_low', 0)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('card_results')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', todayStart.toISOString()),
    ]);

    const real: ScanItem[] = (scansRes.data ?? [])
      .filter(
        (r) =>
          r.player_name &&
          r.player_name !== 'unknown' &&
          r.card_set &&
          r.card_set !== 'unknown' &&
          r.psa_recommendation &&
          /psa/i.test(r.psa_recommendation) &&
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

    const items = real.length >= 10 ? real : [...real, ...SEED_SCANS.slice(0, 12 - real.length)];
    const totalToday = (countRes.count ?? 0) + 47; // seed offset for social proof

    return { items, totalToday };
  } catch {
    return { items: SEED_SCANS, totalToday: 47 };
  }
}

export default async function ScanHubPage() {
  const { items, totalToday } = await getCommunityData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Scan Cards</h1>
        <p className="text-muted text-sm mt-1">
          Choose how you&apos;d like to evaluate your cards
        </p>
      </div>

      <div className="grid gap-4">
        {/* Multi-Card Scan */}
        <Link
          href="/scan/multi"
          className="group block bg-card rounded-2xl border-2 border-border p-5 hover:border-primary transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
              <svg
                className="w-6 h-6 text-primary group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Quick Scan</h2>
              <p className="text-sm text-muted mt-1">
                Photograph up to 9 cards at once. Get player names, estimated
                values, and PSA submission recommendations.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs bg-primary-light text-primary font-semibold px-2.5 py-1 rounded-full">
                  1-9 cards
                </span>
                <span className="text-xs bg-muted-light text-muted font-semibold px-2.5 py-1 rounded-full">
                  Fast results
                </span>
              </div>
            </div>
          </div>
        </Link>

        {/* Single Card Deep Evaluation */}
        <Link
          href="/scan/single"
          className="group block bg-card rounded-2xl border-2 border-border p-5 hover:border-primary transition-colors"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-950/30 rounded-xl flex items-center justify-center shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
              <svg
                className="w-6 h-6 text-accent group-hover:text-white transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold">Deep Evaluation</h2>
              <p className="text-sm text-muted mt-1">
                Detailed PSA grading analysis for a single card. Upload front
                and back for centering, corners, edges, and surface scoring.
              </p>
              <div className="flex items-center gap-2 mt-3">
                <span className="text-xs bg-amber-950/30 text-amber-400 font-semibold px-2.5 py-1 rounded-full">
                  1 card
                </span>
                <span className="text-xs bg-muted-light text-muted font-semibold px-2.5 py-1 rounded-full">
                  Detailed grading
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Community Activity Feed */}
      <ScanCommunityFeed items={items} totalToday={totalToday} />
    </div>
  );
}

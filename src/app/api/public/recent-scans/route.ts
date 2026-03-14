import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const revalidate = 60; // Cache for 60 seconds

export interface PublicScanItem {
  id: string;
  playerName: string;
  cardYear: string;
  cardSet: string;
  sport: string;
  psaRecommendation: string;
  rawPriceLow: number;
  rawPriceHigh: number;
}

// Seeded with iconic cards — shown when real scan volume is low
const SEED_SCANS: PublicScanItem[] = [
  { id: 'seed-1',  playerName: 'Michael Jordan',   cardYear: '1986', cardSet: 'Fleer',               sport: 'NBA', psaRecommendation: 'PSA 8',  rawPriceLow: 2400,  rawPriceHigh: 3200  },
  { id: 'seed-2',  playerName: 'Ken Griffey Jr.',  cardYear: '1989', cardSet: 'Upper Deck',          sport: 'MLB', psaRecommendation: 'PSA 9',  rawPriceLow: 180,   rawPriceHigh: 240   },
  { id: 'seed-3',  playerName: 'LeBron James',     cardYear: '2003', cardSet: 'Topps Chrome',        sport: 'NBA', psaRecommendation: 'PSA 8',  rawPriceLow: 480,   rawPriceHigh: 650   },
  { id: 'seed-4',  playerName: 'Tom Brady',        cardYear: '2000', cardSet: 'Playoff Contenders',  sport: 'NFL', psaRecommendation: 'PSA 7',  rawPriceLow: 3200,  rawPriceHigh: 4800  },
  { id: 'seed-5',  playerName: 'Mickey Mantle',    cardYear: '1952', cardSet: 'Topps',               sport: 'MLB', psaRecommendation: 'PSA 5',  rawPriceLow: 8500,  rawPriceHigh: 12000 },
  { id: 'seed-6',  playerName: 'Wayne Gretzky',    cardYear: '1979', cardSet: 'O-Pee-Chee',          sport: 'NHL', psaRecommendation: 'PSA 6',  rawPriceLow: 1200,  rawPriceHigh: 1800  },
  { id: 'seed-7',  playerName: 'Derek Jeter',      cardYear: '1993', cardSet: 'SP Rookie',           sport: 'MLB', psaRecommendation: 'PSA 8',  rawPriceLow: 320,   rawPriceHigh: 480   },
  { id: 'seed-8',  playerName: 'Luka Doncic',      cardYear: '2018', cardSet: 'Panini Prizm',        sport: 'NBA', psaRecommendation: 'PSA 9',  rawPriceLow: 580,   rawPriceHigh: 780   },
  { id: 'seed-9',  playerName: 'Patrick Mahomes',  cardYear: '2017', cardSet: 'Panini Prizm',        sport: 'NFL', psaRecommendation: 'PSA 9',  rawPriceLow: 220,   rawPriceHigh: 340   },
  { id: 'seed-10', playerName: 'Stephen Curry',    cardYear: '2009', cardSet: 'Upper Deck',          sport: 'NBA', psaRecommendation: 'PSA 8',  rawPriceLow: 680,   rawPriceHigh: 940   },
  { id: 'seed-11', playerName: 'Albert Pujols',    cardYear: '2001', cardSet: 'SP Authentic',        sport: 'MLB', psaRecommendation: 'PSA 9',  rawPriceLow: 340,   rawPriceHigh: 480   },
  { id: 'seed-12', playerName: 'Peyton Manning',   cardYear: '1998', cardSet: 'Score',               sport: 'NFL', psaRecommendation: 'PSA 8',  rawPriceLow: 95,    rawPriceHigh: 145   },
  { id: 'seed-13', playerName: 'Roberto Clemente', cardYear: '1955', cardSet: 'Topps',               sport: 'MLB', psaRecommendation: 'PSA 4',  rawPriceLow: 1800,  rawPriceHigh: 2400  },
  { id: 'seed-14', playerName: 'Nikola Jokic',     cardYear: '2015', cardSet: 'Panini Prizm',        sport: 'NBA', psaRecommendation: 'PSA 9',  rawPriceLow: 140,   rawPriceHigh: 200   },
  { id: 'seed-15', playerName: 'Shohei Ohtani',    cardYear: '2018', cardSet: 'Topps Chrome',        sport: 'MLB', psaRecommendation: 'PSA 10', rawPriceLow: 280,   rawPriceHigh: 420   },
  { id: 'seed-16', playerName: 'Wilt Chamberlain', cardYear: '1961', cardSet: 'Fleer',               sport: 'NBA', psaRecommendation: 'PSA 4',  rawPriceLow: 2200,  rawPriceHigh: 3400  },
  { id: 'seed-17', playerName: 'Joe Montana',      cardYear: '1981', cardSet: 'Topps',               sport: 'NFL', psaRecommendation: 'PSA 8',  rawPriceLow: 580,   rawPriceHigh: 820   },
  { id: 'seed-18', playerName: 'Ichiro Suzuki',    cardYear: '2001', cardSet: 'Topps',               sport: 'MLB', psaRecommendation: 'PSA 9',  rawPriceLow: 120,   rawPriceHigh: 180   },
];

export async function GET() {
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
      .not('raw_price_low', 'is', null)
      .gt('raw_price_low', 0)
      .order('created_at', { ascending: false })
      .limit(20);

    const real: PublicScanItem[] = (data ?? [])
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

    // Blend real scans with seeds — show seeds until we have enough real volume
    const scans = real.length >= 12
      ? real
      : [...real, ...SEED_SCANS.slice(0, 18 - real.length)];

    return NextResponse.json({ scans });
  } catch {
    return NextResponse.json({ scans: SEED_SCANS });
  }
}

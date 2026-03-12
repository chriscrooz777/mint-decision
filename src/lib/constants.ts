export const APP_NAME = 'Mint Decision';

export const PRICING_SOURCES = [
  { name: 'PSA Price Guide', url: 'https://www.psacard.com/auctionprices' },
  { name: 'SportsCardsPro', url: 'https://www.sportscardspro.com' },
  { name: 'COMC', url: 'https://www.comc.com' },
  { name: '130point', url: 'https://130point.com' },
  { name: 'eBay Sold Listings', url: 'https://www.ebay.com/sch/i.html?LH_Complete=1&LH_Sold=1' },
];

export const SUPPORTED_SPORTS = [
  { value: 'MLB', label: 'Baseball (MLB)' },
  { value: 'NBA', label: 'Basketball (NBA)' },
  { value: 'NFL', label: 'Football (NFL)' },
  { value: 'NHL', label: 'Hockey (NHL)' },
  { value: 'golf', label: 'Golf' },
  { value: 'soccer', label: 'Soccer' },
  { value: 'pokemon', label: 'Pokémon' },
  { value: 'other', label: 'Other' },
] as const;

export const MAX_CARDS_PER_SCAN = 9;
export const MAX_IMAGE_SIZE_MB = 4;
export const MAX_IMAGE_DIMENSION = 2048;

export const DISCLAIMER_TEXT =
  'These recommendations are purely AI-based estimates and should only be used to consider your options. Actual card values and PSA grades may differ. Always consult professional grading services and current market data before making buying or selling decisions.';

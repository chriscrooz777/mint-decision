# Mint Decision AI — Claude Context

Sports card evaluation app that uses AI (GPT-4o Vision) to identify, grade, and value trading cards from photos. Mobile-first PWA deployed at **mintdecision.com**.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) with TypeScript |
| Styling | Tailwind CSS v4 — utility classes only, no component libraries |
| Auth & DB | Supabase (PostgreSQL + RLS + Storage) |
| AI | OpenAI GPT-4o via structured outputs (`response_format`) |
| Image processing | `sharp` (server-side cropping, rotation, compression) |
| Hosting | Netlify + `@netlify/plugin-nextjs` |
| State | Zustand (`scanStore`) for scan results in memory |

---

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY     ← "anon public" key from Supabase API settings
SUPABASE_SERVICE_ROLE_KEY         ← "service_role" key (NOT the anon key — they look similar)
OPENAI_API_KEY
```

Set in both `.env.local` (local dev) and Netlify environment variables (production).

---

## Project Structure

```
src/
  app/
    (auth)/           login, signup, OAuth callback
    (main)/           all authenticated pages
      scan/           scan chooser, /single, /multi
      collection/     saved cards list, [cardId] detail, [cardId]/upgrade
      results/[id]    historical scan view
      account/        usage meter, plan info
      pricing/        tier comparison page
    api/
      scan/multi      POST — multi-card AI scan + image upload
      scan/single     POST — single-card AI scan + image upload
      scan/[id]/explain  POST — "why" deep evaluation (paid feature)
      scan/upgrade    POST — upgrade single → deep evaluation
      collection/     GET — saved cards only
      collection/[id] DELETE — unsave from collection (does NOT delete scan history)
      card-results/[id]/image  GET — proxies image from Supabase Storage
      convert-image   POST — converts HEIC/HEIF to JPEG
      tier/           GET — user's current plan
      usage/          GET — monthly scan count
  components/
    features/
      scan/           CardResultCard, MultiCardResults, SingleCardResults,
                      CroppedCardThumbnail, ScanDrawer, ScanCommunityFeed,
                      ImageUploader, etc.
      collection/     SwipeableCard (swipe-to-delete gesture)
      pricing/        PlanChangeModal, TierCard, UsageMeter
    layout/           AppShell, Header, BottomNav
    ui/               Button, Badge, Modal, Skeleton
  lib/
    openai/
      prompts.ts      MULTI_CARD_SYSTEM_PROMPT, SINGLE_CARD_SYSTEM_PROMPT
                      — both use eBay-first pricing methodology
      schemas.ts      Zod schemas for OpenAI structured outputs
    supabase/
      server.ts       SSR Supabase client (uses cookies)
      server-storage.ts  uploadCardImageServer helper
      storage.ts      client-side storage URL helper
    utils/
      cleanupFreeResults.ts  free tier: keeps only latest 5 card_results per user
      format.ts       getCurrentMonthYear, formatPrice, etc.
      image.ts        client-side image utils (HEIC detection, canvas cropping)
      pricing.ts      tier limits, feature gates
  stores/
    scanStore.ts      Zustand store for in-flight scan results
  types/
    scan.ts           AIMultiScanResponse, CardResult, ScanResult, etc.
    collection.ts
    pricing.ts
```

---

## Database Tables (Supabase)

| Table | Purpose |
|---|---|
| `profiles` | `id`, `tier` (free/pro/premium), linked to `auth.users` |
| `scans` | One row per scan session; `scan_type` = 'single' or 'multi' |
| `card_results` | One row per identified card; created on every scan automatically |
| `collection_cards` | Explicit saves: `user_id`, `card_result_id`. Only rows here = user's collection |
| `scan_usage` | Monthly scan counts per user; `month_year` = 'YYYY-MM' |

**Critical distinction**: `card_results` is auto-created on every scan. `collection_cards` is only created when the user explicitly saves a card. The Collection tab queries `collection_cards` first, then filters `card_results` via `.in('id', savedIds)`.

**Storage bucket**: `card-images` — public bucket. Images stored at `{userId}/{cardResultId}.jpg`.

**Supabase RPC functions used**:
- `next_mint_ids(p_user_id, p_count)` — reserves sequential mint IDs for a batch
- `increment_scan_usage(p_user_id, p_month_year)` — upserts scan_usage count

---

## Tiers and Limits

| Tier | Monthly scans | Features |
|---|---|---|
| free | 25 | Basic evaluation only; deep eval locked; collection limited to saved cards |
| pro | 1,000 | Deep evaluation ("Why" explanation); full collection |
| premium | 5,000 | All pro features |

Free tier auto-cleanup: `cleanupFreeResults` keeps only the latest 5 `card_results` per user. This does NOT affect `collection_cards`.

---

## Image Processing Rules

All server-side image processing is in `src/app/api/scan/multi/route.ts` and `src/app/api/scan/single/route.ts`.

### Key rules (enforce these):

1. **Always call `.rotate()` first** in every `sharp` pipeline — this auto-applies EXIF orientation from phone cameras before any other operation. Without it, images appear rotated in collection view.

2. **Single-card scans (grid 1×1)**: Skip cropping entirely. Just compress the full image to ≤2 MB:
   - First pass: max 2048px, quality 85
   - Fallback: max 1600px, quality 75

3. **Multi-card scans**: Crop each card from its grid cell with 5% inward padding, resize to 400px, quality 85. Crop math uses the **rotated** buffer's dimensions (not the raw buffer).

4. **HEIC/HEIF**: Client converts to JPEG before sending to server (`/api/convert-image`).

---

## Scan Flow

### Multi-card (`/scan/multi`)
1. User picks/takes photo → client sends base64 image to `POST /api/scan/multi`
2. Server calls GPT-4o with `MULTI_CARD_SYSTEM_PROMPT` → returns structured JSON: grid dimensions + array of cards with positions, values, conditions
3. Server inserts `card_results` rows, then runs `sharp` to crop + upload each card's region to Storage
4. Client receives card array + gridLayout, renders `MultiCardResults` with `CroppedCardThumbnail` (client-side canvas for preview before Storage URL is ready)
5. User can Save individual cards or Save All → writes to `collection_cards`

### Single-card (`/scan/single`)
1. Same flow but uses `SINGLE_CARD_SYSTEM_PROMPT` and no grid math
2. Returns one card result; server compresses full image (no crop)

### Deep Evaluation (paid)
- `POST /api/scan/[id]/explain` — calls GPT-4o again with more detailed prompt for PSA grading breakdown, centering %, surface defect analysis
- `POST /api/scan/upgrade` — upgrades existing scan result with deep eval data

---

## Pricing Methodology (in prompts)

Both AI prompts follow this hierarchy:
1. **eBay completed/sold listings** — primary source (actual market value)
2. PSA Price Guide, COMC, Heritage/PWCC/Goldin — secondary
3. **Avoid Beckett book values** — tends to inflate above actual market
4. Target realistic mid-market, not floor
5. Junk wax commons: $0.05–$0.50 is correct
6. PSA 10 vs PSA 9 can be 2×–10× difference; PSA population scarcity premium applies

---

## Deployment

- **Production URL**: https://mintdecision.com
- **Host**: Netlify
- **Netlify config**: `netlify.toml` at root; publish directory = `.next` (set in Netlify UI Build settings — do NOT leave blank or set to `/`)
- **Branch**: `main` auto-deploys on push/merge

### Supabase Auth settings
- Site URL: `https://mintdecision.com`
- Redirect URLs: `https://mintdecision.com/**` (no trailing slash variant needed; no `mintdecisions.com` — note: no 's')
- Google OAuth provider enabled

---

## PR History

| PR | Branch | Description |
|---|---|---|
| #2 | `feature/image-persistence-free-tier-plan-modal` | Server-side image persistence (sharp), free tier 5-result cap, plan change modal, deep evaluation upgrade, graded values, back image support |
| #3 | (merged into #2 context) | eBay-first pricing methodology added to both AI prompts |
| #4 | `feature/explicit-save-collection` | Collection only shows explicitly saved cards; save button → "Saved ✓" + trash; Save All → Remove All; DELETE unsaves instead of deleting scan history |
| #5 | `feature/image-rotation-single-card-fix` | Fix image rotation via EXIF `.rotate()`; skip crop for single-card scans; compress to ≤2 MB instead |
| #6 | `feature/dark-theme-qa-network-effect` | Full dark theme audit; logo → `mint-logo2.png`; PlanChangeModal confirm-first fix; title case sitewide; `ScanCommunityFeed` on scan hub; favicon + PWA icons + static OG image; WCAG AA contrast pass (brighter primary, visible tags/badges, progress bar track, PSA recommendation badges with colored borders) |

---

## Dark Theme Conventions

The entire app uses a dark theme via CSS custom property tokens (`--background`, `--card`, `--border`, `--muted`, etc.) defined in `globals.css`. Always use these semantic Tailwind classes — never hardcoded light colors.

### Color token values (globals.css)

| Token | Value | Usage |
|---|---|---|
| `--primary` | `#3b82f6` | Blue text, active badges, primary actions |
| `--primary-dark` | `#2563eb` | Button backgrounds (white text on this passes AA) |
| `--primary-light` | `#1e3a8a` | Badge/card tint backgrounds — use `text-white` on this |
| `--card` | `#1e293b` | Card backgrounds |
| `--border` | `#334155` | Borders and tag/badge backgrounds |
| `--muted` | `#94a3b8` | Secondary text — readable on `--background`, borderline on `--card` |

### Correct dark-friendly color patterns

| Use case | Correct class | Never use |
|---|---|---|
| Amber/warning bg | `bg-amber-950/30 border-amber-800/50 text-amber-400` | `bg-amber-50 text-amber-800` |
| Red/danger bg | `bg-red-950/30 border-red-800/50 text-red-400` | `bg-red-50 text-red-700` |
| Green/success bg | `bg-emerald-900/30 text-emerald-400` | `bg-emerald-100 text-emerald-700` |
| Blue/info bg | `bg-blue-950/30 border-blue-800/50 text-blue-400` | `bg-blue-50 text-blue-600` |
| Sport/set tags | `bg-border text-slate-300` | `bg-muted-light text-muted` (invisible on card bg) |
| PSA rec badges | `bg-emerald/amber/red-900/40 text-*-400 border border-*-800/60` | bare text-only with no bg |
| Inactive buttons | `bg-border text-foreground hover:bg-slate-600` | `bg-muted-light text-muted` (invisible on card bg) |
| Progress bar track | `bg-slate-700` | `bg-muted-light` (same color as card bg — invisible) |
| Text on primary-light bg | `text-white` or `text-blue-200` | `text-primary` (fails contrast on dark blue bg) |

### Logo and assets
- Logo file: `public/mint-logo2.png` — used in `Header.tsx`, landing nav, `login/page.tsx`, `signup/page.tsx`
- Hero badge: `public/hero-badge.png` — used on landing page
- OG image: `public/open-graph-img.png` (1200×630 static PNG)
- Favicon: `src/app/icon.png` (32px), `src/app/apple-icon.png` (180px), auto-wired by Next.js App Router
- PWA icons: `public/icons/icon-192x192.png`, `public/icons/icon-512x512.png`

### UI text conventions
- All headings and titles use **standard English title case** (prepositions like "for", "to", "in", "of" stay lowercase; all content words capitalize)
- No periods at the end of titles or headings
- Tagline: **"Know your cards."**

---

## Known Gotchas

- **SUPABASE_SERVICE_ROLE_KEY vs ANON_KEY**: Both are long JWTs. The service role key decodes to `"role":"service_role"`. The anon key decodes to `"role":"anon"`. Using anon key for service role causes RLS to block server-side operations silently.
- **EXIF rotation**: Phone cameras embed orientation in EXIF. Browsers and canvas honor it; `sharp` does not unless you call `.rotate()` first. Always call `.rotate()` before `.extract()` or any other operation.
- **`card_results` vs `collection_cards`**: Never query `card_results` alone to build the Collection tab — it will show every scan, not just saved ones. Always join through `collection_cards`.
- **Netlify + Next.js**: Publish directory must be `.next`, not blank, not `/`. The `@netlify/plugin-nextjs` handles the rest.
- **`maxDuration = 60`**: Set on scan API routes because GPT-4o Vision calls can take 10–30s. Without it, Netlify's default 10s timeout kills the request.
- **Free tier cleanup**: `cleanupFreeResults` deletes old `card_results` rows but never touches `collection_cards`. If a user saves a card then gets cleaned up, the `collection_cards` row stays but the `card_result` is gone — the collection query handles this gracefully via the `.in()` filter returning nothing for missing IDs.
- **ScanCommunityFeed seed data**: `src/app/(main)/scan/page.tsx` has a `SEED_SCANS` array used as fallback when the DB has fewer than 10 qualifying results (same pattern as the landing page `ActivityTicker`). The `totalToday` count adds a +47 offset so the number isn't 0 on fresh installs.
- **PlanChangeModal flow**: Always opens in `'confirm'` state regardless of upgrade/downgrade direction. The `useEffect` that auto-triggers `processChange()` only fires when `state === 'processing'`, which only happens after the user explicitly clicks Confirm/Upgrade/Downgrade.

---

## Local Development

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # verify no TypeScript errors before committing
```

`.env.local` must be present with all four env vars listed above.

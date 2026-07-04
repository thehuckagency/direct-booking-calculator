# Direct Booking Revenue Recovery Calculator

A single-page, embeddable lead-generation calculator for **Huck**. It shows hoteliers how
much revenue they lose to OTA commission and how much they could recover by shifting bookings
direct. Every input doubles as a sales-qualification signal captured with the lead.

Built with **React + TypeScript + Tailwind + Vite**. No backend, no external data calls, no auth.
Works standalone or inside an `<iframe>`, and is straightforward to paste into Lovable.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in dist/
npm run preview    # preview the production build
npm test           # run the calculateRecovery unit tests
```

## The two things you configure

Both live in [`src/config.ts`](src/config.ts) and can also be set as Vite env vars
(see [`.env.example`](.env.example)) so they change per deploy without editing code:

| Constant | Env var | What it does |
|---|---|---|
| `LEAD_WEBHOOK_URL` | `VITE_LEAD_WEBHOOK_URL` | URL the captured lead is POSTed to. Point it at your CRM inbound or the lead-nurture backend. **Leave blank and the payload is logged to the browser console instead of sent** (handy in preview). |
| `BOOKING_URL` | `VITE_BOOKING_URL` | Where the post-capture "Book a review" button links. |

There is also `PRIVACY_POLICY_URL` / `VITE_PRIVACY_URL` for the GDPR consent link.

## The `CONFIG` object

Everything tunable lives in one `CONFIG` object at the top of [`src/config.ts`](src/config.ts):
every field's **default, min, max, step**, and a **benchmark citation** (shown in the "?" tooltip
next to benchmarked inputs). Update the figures there without touching any calculation logic. The
benchmarks ship as of 2026:

- OTA commission default **17.5%** (Booking.com 2026 avg), range 5–35%
- OTA share of bookings default **40%** (independents avg ~35–63%)
- Direct booking cost of sale default **5%** (typically 4–7%)
- Target direct shift default **15%** (conservative)
- Days per month **30.4** (used by the rooms + occupancy path)

## The calculation

All logic is a pure, unit-tested function: [`calculateRecovery(inputs)`](src/lib/calculateRecovery.ts).
It clamps every input to range, is NaN-safe (empty/zero never produces `NaN`), rounds all currency
to the nearest £, and never returns a negative recovery. If the direct cost of sale meets or exceeds
the commission rate it returns £0 with a `directCostExceedsCommission` flag so the UI can explain why.

Two paths to room volume, toggled in the UI:

- **Path A** (default): `monthlyRoomRevenue = ADR × monthlyRoomNights`
- **Path B**: `monthlyRoomNights = rooms × 30.4 × (occupancy / 100)`, then as Path A

Headline figure: `netAnnualRecovery = commissionSaved − directCostIncurred`.

Tests live in [`src/lib/calculateRecovery.test.ts`](src/lib/calculateRecovery.test.ts) — run `npm test`.

## Lead capture payload

On submit, the calculator POSTs a **flat JSON** body to `LEAD_WEBHOOK_URL` (all inputs + all
computed outputs + contact + consent), ready to route straight into a CRM:

```json
{
  "email": "gm@example-hotel.co.uk",
  "hotelName": "The Example Hotel",
  "name": "Alex Smith",
  "consent": true,

  "revenuePath": "A",
  "adr": 120,
  "monthlyRoomNights": 600,
  "rooms": 40,
  "occupancy": 70,
  "otaSharePct": 40,
  "commissionPct": 17.5,
  "targetShiftPct": 15,
  "directCostOfSalePct": 5,

  "annualRoomRevenue": 864000,
  "otaRevenue": 345600,
  "currentCommissionCost": 60480,
  "netAnnualRecovery": 6480,
  "monthlyRecovery": 540,
  "threeYearRecovery": 19440,

  "source": "direct-booking-recovery-calculator",
  "submittedAt": "2026-07-04T09:00:00.000Z"
}
```

The `email` field is the required, validated one; `hotelName` and `name` are optional. `consent`
records the GDPR checkbox. `rooms` / `occupancy` are always sent but are only meaningful when
`revenuePath` is `"B"`.

## Brand notes

Huck greens on cool paper (`#E6EFEB` bg, `#1A2922` ink). Headings use **Fraunces** as a stand-in
for the licensed **GT Alpina**; body is **Zalando Sans**, both from Google Fonts. Swap Fraunces for
the licensed GT Alpina webfont when available. UK English, GBP, no em dashes.

## Structure

```
src/
  config.ts                  CONFIG + the two config constants
  lib/
    calculateRecovery.ts     pure calculation (the only place logic lives)
    calculateRecovery.test.ts
    format.ts                £ / % / integer formatting helpers
    hooks.ts                 count-up, debounce, reduced-motion
  components/
    Logo.tsx                 inlined Huck wordmark
    Inputs.tsx               slider + number field
    InfoTooltip.tsx          "?" benchmark citations
    Results.tsx              headline, stat cards, comparison bars, sentence
    EmailGate.tsx            capture form + webhook POST + post-capture CTA
  App.tsx                    layout + state
  main.tsx
```

// Single authoritative currency setting. Stripe requires a lowercase ISO
// 4217 code (e.g. "usd", "eur", "inr") — the frontend fetches this same
// value via /api/config and derives its display symbol from it (see
// client/src/context/AppContext.jsx), so there is exactly one place this
// is configured rather than a Stripe-side value and a separate frontend
// symbol that can silently drift apart.
export const getCurrencyCode = () => (process.env.CURRENCY || "usd").toLowerCase();

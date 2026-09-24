import { getCurrencyCode } from "../utils/currency.js";

// GET /api/config — public, no auth needed. Frontend calls this once on
// load so it never has to hardcode a currency separately from Stripe.
export const getPublicConfig = (req, res) => {
  res.json({ success: true, currency: getCurrencyCode() });
};

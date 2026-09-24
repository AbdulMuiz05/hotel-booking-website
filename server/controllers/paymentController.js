import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { getCurrencyCode } from "../utils/currency.js";
import { sendError } from "../utils/sendError.js";

// POST /api/bookings/:id/pay
// :id is pre-validated as an ObjectId by the validateObjectIdParam middleware.
export const expireOpenCheckoutSession = async (stripeSessionId) => {
  if (!stripeSessionId || !process.env.STRIPE_SECRET_KEY) return;
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  try {
    const session = await stripeInstance.checkout.sessions.retrieve(stripeSessionId);
    if (session.status === "open") {
      await stripeInstance.checkout.sessions.expire(stripeSessionId);
    }
  } catch (error) {
    console.warn("Could not expire Stripe Checkout Session:", error.message);
  }
};

export const createCheckoutSession = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("hotel");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to pay for this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Cannot pay for a cancelled booking" });
    }

    if (booking.isPaid) {
      return res.status(400).json({ success: false, message: "Booking is already paid" });
    }

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

    // Reuse an existing session instead of minting a new one on every
    // "Pay Now" click (double-click, page refresh, going back, etc.) —
    // otherwise each click creates a fresh, forgotten Checkout Session.
    if (booking.stripeSessionId) {
      try {
        const existing = await stripeInstance.checkout.sessions.retrieve(booking.stripeSessionId);

        if (existing.status === "open") {
          return res.json({ success: true, url: existing.url });
        }

        if (existing.status === "complete") {
          // Payment is already going through this session; the webhook
          // will (or already did) mark the booking paid. Don't hand back
          // a dead session URL, and don't create a second one.
          return res.status(409).json({
            success: false,
            message: "Payment for this booking is already being processed",
          });
        }
        // status === "expired" falls through to create a fresh session below.
      } catch (stripeError) {
        // Session id we stored no longer resolves on Stripe's side (e.g.
        // test/live key mismatch, or it was deleted) — fall through and
        // create a new one rather than failing the request.
        console.warn("Could not retrieve existing Stripe session, creating a new one:", stripeError.message);
      }
    }

    const origin = process.env.CLIENT_URL;

    // Amount and currency both come from server-side, authoritative
    // sources — booking.totalPrice was computed in createBooking from the
    // room's price, and the currency code is the same one exposed via
    // /api/config for frontend display, never a value from this request.
    const session = await stripeInstance.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: getCurrencyCode(),
            product_data: { name: `${booking.hotel.name} booking` },
            unit_amount: Math.round(booking.totalPrice * 100),
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/my-bookings`,
      cancel_url: `${origin}/my-bookings`,
      client_reference_id: booking._id.toString(),
      metadata: {
        bookingId: booking._id.toString(),
        userId: req.user._id,
      },
    });

    booking.stripeSessionId = session.id;
    await booking.save();

    res.json({ success: true, url: session.url });
  } catch (error) {
    sendError(res, error);
  }
};

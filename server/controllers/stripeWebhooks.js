import Stripe from "stripe";
import Booking from "../models/Booking.js";
import StripeEvent from "../models/StripeEvent.js";
import User from "../models/User.js";
import { sendBookingEmail } from "../utils/email.js";

// POST /api/stripe — req.body must be the raw Buffer (wired in server.js)
const stripeWebhooks = async (req, res) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const signature = req.headers["stripe-signature"];

  let event;
  try {
    event = stripeInstance.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    console.error("Stripe webhook signature verification failed:", error.message);
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;

        if (session.payment_status === "paid") {
          const bookingId = session.metadata?.bookingId;

          if (bookingId) {
            const booking = await Booking.findById(bookingId).populate("hotel").populate("room");

            if (!booking) {
              console.error(`Booking ${bookingId} was not found for Stripe event ${event.id}`);
              return res.status(404).json({ received: false, message: "Booking not found" });
            }

            // A Checkout Session is valid only for the session currently
            // attached to the booking. This prevents an old session from
            // confirming a booking after the customer modified or cancelled it.
            if (booking.stripeSessionId !== session.id) {
              console.warn(`Ignoring stale Stripe session ${session.id} for booking ${bookingId}`);
              return res.json({ received: true, ignored: true });
            }

            // The conditional update makes payment confirmation idempotent
            // even if Stripe delivers the same event concurrently. Only the
            // request that changes isPaid from false to true sends the email.
            const updatedBooking = await Booking.findOneAndUpdate(
              { _id: booking._id, isPaid: false, status: { $ne: "cancelled" }, stripeSessionId: session.id },
              {
                $set: {
                  isPaid: true,
                  status: "confirmed",
                  paymentMethod: "Stripe",
                },
              },
              { new: true }
            ).populate("hotel").populate("room");

            if (updatedBooking) {
              const user = await User.findById(updatedBooking.user);
              sendBookingEmail({
                to: user?.email,
                name: user?.username,
                booking: updatedBooking,
                paid: true,
              }).catch(error => console.warn("Payment confirmation email could not be sent:", error.message));
            }
          } else {
            console.error("checkout.session.completed missing bookingId metadata", event.id);
            return res.status(400).json({ received: false, message: "Missing booking metadata" });
          }
        }
        break;
      }

      case "checkout.session.async_payment_failed":
      case "payment_intent.payment_failed": {
        console.log(`Stripe payment failed (event ${event.id}, type ${event.type})`);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    // Record the event only AFTER successful processing. If processing fails,
    // Stripe receives a non-2xx response and can retry the event. A retry that
    // reaches this point is still safe because payment confirmation above is
    // guarded by the atomic isPaid=false condition.
    try {
      await StripeEvent.create({ eventId: event.id, type: event.type });
    } catch (claimError) {
      if (claimError?.code !== 11000) throw claimError;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error handling Stripe webhook:", error.message);
    res.status(500).json({ received: false, message: error.message });
  }
};

export default stripeWebhooks;

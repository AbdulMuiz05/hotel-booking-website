import mongoose from "mongoose";

// Every processed Stripe webhook event is recorded here so that a
// redelivered event (Stripe retries on timeout/non-2xx) is a no-op instead
// of re-applying side effects.
const stripeEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

const StripeEvent = mongoose.model("StripeEvent", stripeEventSchema);
export default StripeEvent;

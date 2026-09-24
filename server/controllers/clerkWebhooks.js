import { Webhook } from "svix";
import User from "../models/User.js";

// POST /api/clerk — receives user.created / user.updated / user.deleted events
const clerkWebhooks = async (req, res) => {
  try {
    const whook = new Webhook(process.env.CLERK_WEBHOOK_SECRET);

    const headers = {
      "svix-id": req.headers["svix-id"],
      "svix-timestamp": req.headers["svix-timestamp"],
      "svix-signature": req.headers["svix-signature"],
    };

    // req.body must be the raw Buffer here — see server.js route wiring
    whook.verify(req.body, headers);

    const { data, type } = JSON.parse(req.body);

    const userData = {
      _id: data.id,
      email: data.email_addresses?.[0]?.email_address || `${data.id}@clerk.local`,
      username: `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim() || "QuickStay User",
      image: data.image_url || "",
    };

    switch (type) {
      case "user.created":
        await User.findByIdAndUpdate(
          data.id,
          { $set: userData, $setOnInsert: { role: "user", recentSearchedCities: [] } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        break;
      case "user.updated":
        await User.findByIdAndUpdate(data.id, { $set: userData }, { new: true });
        break;
      case "user.deleted":
        await User.findByIdAndDelete(data.id);
        break;
      default:
        break;
    }

    res.json({ success: true, message: "Webhook received" });
  } catch (error) {
    console.error("Clerk webhook error:", error.message);
    res.status(400).json({ success: false, message: error.message });
  }
};

export default clerkWebhooks;

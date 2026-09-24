import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from "@clerk/express";

import connectDB from "./config/db.js";
import connectCloudinary from "./config/cloudinary.js";
import clerkWebhooks from "./controllers/clerkWebhooks.js";
import stripeWebhooks from "./controllers/stripeWebhooks.js";
import userRouter from "./routes/userRoutes.js";
import hotelRouter from "./routes/hotelRoutes.js";
import roomRouter from "./routes/roomRoutes.js";
import bookingRouter from "./routes/bookingRoutes.js";
import configRouter from "./routes/configRoutes.js";
import reviewRouter from "./routes/reviewRoutes.js";
import { rateLimit } from "./middleware/rateLimit.js";


const app = express();

await connectDB();
await connectCloudinary();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));

// Webhooks need the RAW body for signature verification, so these routes
// are registered BEFORE express.json() and use express.raw() themselves.
app.post("/api/clerk", express.raw({ type: "application/json" }), clerkWebhooks);
app.post("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

app.use(express.json({ limit: "100kb" }));
app.use(clerkMiddleware());

app.get("/", (req, res) => res.send("API is working"));

app.use("/api/user", userRouter);
app.use("/api/hotels", rateLimit({ windowMs: 60_000, max: 120 }), hotelRouter);
app.use("/api/rooms", rateLimit({ windowMs: 60_000, max: 120 }), roomRouter);
app.use("/api/bookings", rateLimit({ windowMs: 60_000, max: 60 }), bookingRouter);
app.use("/api/config", configRouter);
app.use("/api/reviews", rateLimit({ windowMs: 60_000, max: 60 }), reviewRouter);


// Centralized error handler (anything thrown in async controllers not
// already try/caught lands here instead of crashing the process)
app.use((err, req, res, next) => {
  console.error(err);
  if (err.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}` });
  }
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Something went wrong",
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

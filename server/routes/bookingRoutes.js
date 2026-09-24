import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { validateObjectIdParam } from "../middleware/validateObjectId.js";
import {
  checkAvailabilityAPI,
  createBooking,
  getUserBookings,
  getHotelBookings,
  getBookingById,
  cancelBooking,
  updateBooking,
  deleteBooking,
} from "../controllers/bookingController.js";
import { createCheckoutSession } from "../controllers/paymentController.js";

const bookingRouter = express.Router();

bookingRouter.post("/check-availability", checkAvailabilityAPI);
bookingRouter.post("/", protect, createBooking);
bookingRouter.get("/user", protect, getUserBookings);
bookingRouter.get("/hotel", protect, getHotelBookings);
bookingRouter.get("/:id", protect, validateObjectIdParam("id"), getBookingById);
bookingRouter.post("/:id/cancel", protect, validateObjectIdParam("id"), cancelBooking);
bookingRouter.put("/:id", protect, validateObjectIdParam("id"), updateBooking);
bookingRouter.delete("/:id", protect, validateObjectIdParam("id"), deleteBooking);
bookingRouter.post("/:id/pay", protect, validateObjectIdParam("id"), createCheckoutSession);

export default bookingRouter;

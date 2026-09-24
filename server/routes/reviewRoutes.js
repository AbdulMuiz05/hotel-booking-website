import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getHotelReviews, createReview, updateReview, deleteReview, getMyReview } from "../controllers/reviewController.js";
import { validateObjectIdParam } from "../middleware/validateObjectId.js";

const reviewRouter = express.Router();
reviewRouter.get("/hotel/:hotelId", getHotelReviews);
reviewRouter.get("/my/:bookingId", protect, validateObjectIdParam("bookingId"), getMyReview);
reviewRouter.post("/hotel/:hotelId", protect, createReview);
reviewRouter.put("/:id", protect, validateObjectIdParam("id"), updateReview);
reviewRouter.delete("/:id", protect, validateObjectIdParam("id"), deleteReview);
export default reviewRouter;

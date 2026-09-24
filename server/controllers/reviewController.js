import Review from "../models/Review.js";
import Booking from "../models/Booking.js";
import Hotel from "../models/Hotel.js";
import { isValidObjectId } from "../middleware/validateObjectId.js";
import { sendError } from "../utils/sendError.js";

const validate = (rating, comment) => {
  const r = Number(rating);
  const c = String(comment || "").trim();
  if (!Number.isInteger(r) || r < 1 || r > 5) throw { status: 400, message: "Rating must be between 1 and 5" };
  if (c.length < 5 || c.length > 1000) throw { status: 400, message: "Comment must be between 5 and 1000 characters" };
  return { rating: r, comment: c };
};

export const getHotelReviews = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.hotelId)) return res.status(400).json({ success: false, message: "Invalid hotel id" });
    const reviews = await Review.find({ hotel: req.params.hotelId }).populate("user", "username image").sort({ createdAt: -1 });
    const averageRating = reviews.length ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10 : 0;
    res.json({ success: true, reviews, averageRating, count: reviews.length });
  } catch (error) { sendError(res, error); }
};

export const createReview = async (req, res) => {
  try {
    const { bookingId } = req.body;
    if (!isValidObjectId(bookingId) || !isValidObjectId(req.params.hotelId)) return res.status(400).json({ success: false, message: "Invalid id" });
    const hotel = await Hotel.findById(req.params.hotelId);
    const booking = await Booking.findById(bookingId);
    if (!hotel || !booking) return res.status(404).json({ success: false, message: "Hotel or booking not found" });
    if (String(booking.user) !== String(req.user._id) || String(booking.hotel) !== String(hotel._id)) return res.status(403).json({ success: false, message: "This booking does not belong to you or this hotel" });
    if (!booking.isPaid || booking.status !== "confirmed" || new Date(booking.checkOutDate) > new Date()) return res.status(400).json({ success: false, message: "You can review the hotel after a completed paid stay" });
    if (await Review.exists({ booking: booking._id })) return res.status(409).json({ success: false, message: "You already reviewed this booking" });
    const { rating, comment } = validate(req.body.rating, req.body.comment);
    const review = await Review.create({ user: req.user._id, hotel: hotel._id, booking: booking._id, rating, comment });
    res.status(201).json({ success: true, message: "Review submitted successfully", review: await review.populate("user", "username image") });
  } catch (error) { sendError(res, error); }
};

export const updateReview = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid review id" });
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    if (String(review.user) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not authorized" });
    Object.assign(review, validate(req.body.rating, req.body.comment));
    await review.save();
    res.json({ success: true, message: "Review updated successfully", review });
  } catch (error) { sendError(res, error); }
};

export const deleteReview = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid review id" });
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).json({ success: false, message: "Review not found" });
    if (String(review.user) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not authorized" });
    await review.deleteOne();
    res.json({ success: true, message: "Review deleted successfully" });
  } catch (error) { sendError(res, error); }
};

export const getMyReview = async (req, res) => {
  try {
    const review = await Review.findOne({ user: req.user._id, booking: req.params.bookingId });
    res.json({ success: true, review });
  } catch (error) { sendError(res, error); }
};

import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    user: { type: String, required: true, ref: "User" },
    hotel: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Hotel" },
    booking: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Booking" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { timestamps: true }
);

// One review per completed booking
reviewSchema.index({ booking: 1 }, { unique: true });
reviewSchema.index({ hotel: 1, createdAt: -1 });

const Review = mongoose.model("Review", reviewSchema);
export default Review;

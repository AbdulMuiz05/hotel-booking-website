import mongoose from "mongoose";

const roomSchema = new mongoose.Schema(
  {
    hotel: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "Hotel" },
    roomType: {
      type: String,
      required: true,
      enum: ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"],
    },
    pricePerNight: { type: Number, required: true, min: 0 },
    maxGuests: { type: Number, required: true, min: 1 },
    amenities: [{ type: String, required: true }],
    images: [{ type: String, required: true }],
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

roomSchema.index({ hotel: 1, isAvailable: 1 });

const Room = mongoose.model("Room", roomSchema);
export default Room;

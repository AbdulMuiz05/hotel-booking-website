import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { registerHotel, getHotels, getHotelById, getOwnerHotel, updateHotel, deleteHotel } from "../controllers/hotelController.js";

const hotelRouter = express.Router();
hotelRouter.get("/", getHotels);
hotelRouter.get("/owner/me", protect, getOwnerHotel);
hotelRouter.get("/:id", getHotelById);
hotelRouter.post("/", protect, upload.array("images", 8), registerHotel);
hotelRouter.put("/:id", protect, upload.array("images", 8), updateHotel);
hotelRouter.delete("/:id", protect, deleteHotel);
export default hotelRouter;

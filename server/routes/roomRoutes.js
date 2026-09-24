import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import upload from "../middleware/upload.js";
import { createRoom, getRooms, getOwnerRooms, getRoomById, updateRoom, deleteRoom, toggleRoomAvailability } from "../controllers/roomController.js";
import { validateObjectIdParam } from "../middleware/validateObjectId.js";

const roomRouter = express.Router();
roomRouter.get("/", getRooms);
roomRouter.get("/owner", protect, getOwnerRooms);
roomRouter.get("/:id", getRoomById);
roomRouter.post("/", protect, upload.array("images", 4), createRoom);
roomRouter.put("/:id", protect, validateObjectIdParam("id"), upload.array("images", 4), updateRoom);
roomRouter.delete("/:id", protect, validateObjectIdParam("id"), deleteRoom);
roomRouter.post("/toggle-availability", protect, toggleRoomAvailability);
export default roomRouter;

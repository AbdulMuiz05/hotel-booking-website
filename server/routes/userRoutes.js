import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { getUserData, updateUserProfile, storeRecentSearchedCities } from "../controllers/userController.js";
const userRouter = express.Router();
userRouter.get("/", protect, getUserData);
userRouter.put("/", protect, updateUserProfile);
userRouter.post("/store-recent-search", protect, storeRecentSearchedCities);
export default userRouter;

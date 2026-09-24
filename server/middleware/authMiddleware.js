import User from "../models/User.js";

// Requires @clerk/express's clerkMiddleware() to have already run so that
// req.auth() is available. Attaches the Mongo user doc to req.user.
export const protect = async (req, res, next) => {
  try {
    const { userId } = req.auth();

    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authorized" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Not authorized" });
  }
};

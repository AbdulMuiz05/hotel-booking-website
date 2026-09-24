import mongoose from "mongoose";

// Use on any route with an :paramName that's meant to be a Mongo ObjectId.
export const validateObjectIdParam = (paramName) => (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params[paramName])) {
    return res.status(400).json({ success: false, message: `Invalid ${paramName}` });
  }
  next();
};

// For IDs supplied in the request body instead of the URL (e.g. "room" or
// "roomId" fields).
export const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

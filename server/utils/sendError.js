// Central place to turn a thrown/caught error into the right HTTP response.
// Without this, a malformed ObjectId (Mongoose CastError) or a duplicate-key
// write (code 11000) would fall through to a generic 500 even though they're
// really client errors (400/409).
export const sendError = (res, error, fallbackStatus = 500) => {
  if (error?.name === "CastError") {
    return res.status(400).json({ success: false, message: `Invalid ${error.path}` });
  }

  if (error?.name === "ValidationError") {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error?.code === 11000) {
    return res.status(409).json({ success: false, message: "A conflicting record already exists" });
  }

  const status = error?.status || fallbackStatus;
  return res.status(status).json({ success: false, message: error?.message || "Something went wrong" });
};

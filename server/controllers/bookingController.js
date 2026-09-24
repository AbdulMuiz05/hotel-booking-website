import Booking from "../models/Booking.js";
import Room from "../models/Room.js";
import Hotel from "../models/Hotel.js";
import {
  parseAndValidateDates,
  parseAndValidateGuests,
  calculateNights,
  isRoomAvailable,
} from "../utils/availability.js";
import { sendError } from "../utils/sendError.js";
import { sendBookingEmail } from "../utils/email.js";
import { isValidObjectId } from "../middleware/validateObjectId.js";
import { expireOpenCheckoutSession } from "./paymentController.js";

// POST /api/bookings/check-availability
// Public — used by the room details page before a user is asked to sign in.
export const checkAvailabilityAPI = async (req, res) => {
  try {
    const { room, checkInDate, checkOutDate, guests } = req.body;

    if (!room) {
      return res.status(400).json({ success: false, message: "room is required" });
    }
    if (!isValidObjectId(room)) {
      return res.status(400).json({ success: false, message: "Invalid room id" });
    }

    const roomDoc = await Room.findById(room);
    if (!roomDoc) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    const { checkIn, checkOut } = parseAndValidateDates(checkInDate, checkOutDate);

    // guests is optional here (the UI may check dates before the guest
    // count is finalized) but if it's supplied, capacity is enforced too.
    if (guests !== undefined && guests !== null && guests !== "") {
      parseAndValidateGuests(guests, roomDoc);
    }

    // The room's own isAvailable flag is an owner-level kill switch
    // (e.g. under maintenance) — it must block bookings independently of
    // whether the dates happen to be free.
    if (!roomDoc.isAvailable) {
      return res.json({ success: true, isAvailable: false });
    }

    const { available } = await isRoomAvailable(room, checkIn, checkOut);
    res.json({ success: true, isAvailable: available });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/bookings — create a booking for the logged-in user
export const createBooking = async (req, res) => {
  try {
    const { room: roomId, checkInDate, checkOutDate, guests } = req.body;

    if (!roomId || !checkInDate || !checkOutDate || !guests) {
      return res.status(400).json({
        success: false,
        message: "room, checkInDate, checkOutDate and guests are required",
      });
    }
    if (!isValidObjectId(roomId)) {
      return res.status(400).json({ success: false, message: "Invalid room id" });
    }

    const { checkIn, checkOut } = parseAndValidateDates(checkInDate, checkOutDate);

    const room = await Room.findById(roomId).populate("hotel");
    if (!room) {
      return res.status(404).json({ success: false, message: "Room not found" });
    }

    // Capacity is enforced against the actual room document, not a value
    // the frontend claims — parseAndValidateGuests throws a 400 if over.
    const guestCount = parseAndValidateGuests(guests, room);

    if (!room.isAvailable) {
      return res.status(409).json({ success: false, message: "This room is not currently bookable" });
    }

    const { available } = await isRoomAvailable(roomId, checkIn, checkOut);
    if (!available) {
      return res.status(409).json({ success: false, message: "Room is not available for the selected dates" });
    }

    // Price is always computed server-side from the room's current price —
    // the frontend never supplies (or is trusted for) an amount.
    const nights = calculateNights(checkIn, checkOut);
    const totalPrice = Math.round(room.pricePerNight * nights * 100) / 100;

    const booking = await Booking.create({
      user: req.user._id,
      room: room._id,
      hotel: room.hotel._id,
      checkInDate: checkIn,
      checkOutDate: checkOut,
      guests: guestCount,
      totalPrice,
    });

    // Best-effort race-condition guard: two requests can both pass the
    // availability check above before either commits. Immediately after
    // inserting, re-check for another non-cancelled overlapping booking
    // that was created earlier than this one — if found, this request lost
    // the race and is rolled back. This narrows the race window to the
    // time between the two queries rather than eliminating it outright;
    // a fully atomic guarantee would need a per-room-date lock or a unique
    // constraint on the date range, which Mongo can't express directly.
    const { overlapping } = await isRoomAvailable(roomId, checkIn, checkOut, booking._id);
    const earlierConflict = overlapping.find((b) => {
      const otherTime = new Date(b.createdAt).getTime();
      const ownTime = booking.createdAt.getTime();
      if (otherTime !== ownTime) return otherTime < ownTime;
      return String(b._id) < String(booking._id);
    });

    if (earlierConflict) {
      await Booking.findByIdAndDelete(booking._id);
      return res.status(409).json({ success: false, message: "Room was just booked by someone else for these dates" });
    }

    const populatedBooking = await booking.populate([{ path: "room" }, { path: "hotel" }]);
    sendBookingEmail({
      to: req.user.email,
      name: req.user.username,
      booking: populatedBooking,
      paid: false,
    }).catch(error => console.warn("Booking email could not be sent:", error.message));

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      booking: populatedBooking,
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/bookings/user — the logged-in user's own bookings
export const getUserBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate("room")
      .populate("hotel")
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/bookings/hotel — owner view of all bookings for their hotel
export const getHotelBookings = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.user._id });
    if (!hotel) {
      return res.status(404).json({ success: false, message: "No hotel found for this account" });
    }

    const bookings = await Booking.find({ hotel: hotel._id })
      .populate("room")
      .populate("user", "username email image")
      .sort({ createdAt: -1 });

    const rooms = await Room.find({ hotel: hotel._id }).select("roomType pricePerNight maxGuests isAvailable").lean();
    const totalBookings = bookings.length;
    const paidBookings = bookings.filter((b) => b.isPaid);
    const pendingBookings = bookings.filter((b) => b.status === "pending");
    const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
    const cancelledBookings = bookings.filter((b) => b.status === "cancelled");
    const totalRevenue = paidBookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const activeRooms = rooms.filter((r) => r.isAvailable).length;
    const unavailableRooms = rooms.length - activeRooms;
    const upcomingBookings = bookings.filter(
      (b) => b.status !== "cancelled" && new Date(b.checkOutDate) > new Date()
    ).length;

    const now = new Date();
    const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
      const date = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: date.toLocaleString("en-US", { month: "short" }),
        year: date.getFullYear(),
        revenue: 0,
        bookings: 0,
      };
    });

    const monthlyMap = new Map(monthlyRevenue.map((month) => [month.key, month]));
    paidBookings.forEach((booking) => {
      const date = new Date(booking.createdAt);
      const month = monthlyMap.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (month) month.revenue += booking.totalPrice;
    });

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt);
      const month = monthlyMap.get(`${date.getFullYear()}-${date.getMonth()}`);
      if (month) month.bookings += 1;
    });

    monthlyRevenue.forEach((month) => {
      month.revenue = Math.round(month.revenue * 100) / 100;
      delete month.key;
    });

    const roomBreakdown = rooms.reduce((acc, room) => {
      acc[room.roomType] = (acc[room.roomType] || 0) + 1;
      return acc;
    }, {});

    res.json({
      success: true,
      dashboardData: {
        bookings,
        totalBookings,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        paidBookings: paidBookings.length,
        pendingBookings: pendingBookings.length,
        confirmedBookings: confirmedBookings.length,
        cancelledBookings: cancelledBookings.length,
        totalRooms: rooms.length,
        activeRooms,
        unavailableRooms,
        upcomingBookings,
        monthlyRevenue,
        roomBreakdown,
      },
    });
  } catch (error) {
    sendError(res, error);
  }
};

// GET /api/bookings/:id — booking owner or the hotel's owner may view it
// :id is pre-validated as an ObjectId by the validateObjectIdParam middleware.
export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("room")
      .populate("hotel");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    const isBookingOwner = String(booking.user) === String(req.user._id);
    const isHotelOwner = String(booking.hotel.owner) === String(req.user._id);

    if (!isBookingOwner && !isHotelOwner) {
      return res.status(403).json({ success: false, message: "Not authorized to view this booking" });
    }

    res.json({ success: true, booking });
  } catch (error) {
    sendError(res, error);
  }
};

// POST /api/bookings/:id/cancel
export const cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (String(booking.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Not authorized to cancel this booking" });
    }

    if (booking.status === "cancelled") {
      return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    }

    if (booking.isPaid) {
      // No Stripe refund flow is implemented, so a paid booking is not
      // self-service cancellable — this deliberately avoids pretending to
      // process a refund that never happens.
      return res.status(400).json({
        success: false,
        message: "This booking is already paid. Contact support to cancel and arrange a refund.",
      });
    }

    if (new Date(booking.checkInDate) <= new Date()) {
      return res.status(400).json({ success: false, message: "Cannot cancel a booking that has already started" });
    }

    await expireOpenCheckoutSession(booking.stripeSessionId);
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.stripeSessionId = null;
    await booking.save();

    res.json({ success: true, message: "Booking cancelled" });
  } catch (error) {
    sendError(res, error);
  }
};

export const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate("room");
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (String(booking.user) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not authorized to modify this booking" });
    if (booking.status === "cancelled" || booking.isPaid) return res.status(400).json({ success: false, message: "Only unpaid active bookings can be changed" });
    const { checkInDate, checkOutDate, guests } = req.body;
    const { checkIn, checkOut } = parseAndValidateDates(checkInDate, checkOutDate);
    const guestCount = parseAndValidateGuests(guests, booking.room);
    if (!booking.room.isAvailable) {
      return res.status(409).json({ success: false, message: "This room is not currently bookable" });
    }
    const { available } = await isRoomAvailable(booking.room._id, checkIn, checkOut, booking._id);
    if (!available) return res.status(409).json({ success: false, message: "Room is not available for the selected dates" });
    await expireOpenCheckoutSession(booking.stripeSessionId);
    booking.checkInDate = checkIn;
    booking.checkOutDate = checkOut;
    booking.guests = guestCount;
    booking.totalPrice = Math.round(booking.room.pricePerNight * calculateNights(checkIn, checkOut) * 100) / 100;
    booking.stripeSessionId = null;
    await booking.save();
    res.json({ success: true, message: "Booking updated successfully", booking: await booking.populate(["room","hotel"]) });
  } catch (error) { sendError(res, error); }
};

export const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });
    if (String(booking.user) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not authorized to delete this booking" });
    if (booking.isPaid) return res.status(400).json({ success: false, message: "Paid bookings cannot be deleted. Contact support for cancellation and refund." });
    if (booking.status === "cancelled") return res.status(400).json({ success: false, message: "Booking is already cancelled" });
    await expireOpenCheckoutSession(booking.stripeSessionId);
    booking.status = "cancelled";
    booking.cancelledAt = new Date();
    booking.stripeSessionId = null;
    await booking.save();
    res.json({ success: true, message: "Booking cancelled successfully" });
  } catch (error) { sendError(res, error); }
};

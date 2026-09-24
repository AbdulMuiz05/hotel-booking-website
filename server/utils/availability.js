import Booking from "../models/Booking.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/**
 * Parses and validates a check-in/check-out date pair.
 * Throws a { status, message } style error object on invalid input.
 */
export const parseAndValidateDates = (checkInDate, checkOutDate) => {
  const parseDate = value => {
    if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [year, month, day] = value.split("-").map(Number);
      const date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return new Date(NaN);
      return date;
    }
    return new Date(value);
  };

  const checkIn = parseDate(checkInDate);
  const checkOut = parseDate(checkOutDate);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    throw { status: 400, message: "Invalid check-in or check-out date" };
  }

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  if (checkIn < startOfToday) {
    throw { status: 400, message: "Check-in date cannot be in the past" };
  }

  if (checkOut <= checkIn) {
    throw { status: 400, message: "Check-out date must be after check-in date" };
  }

  return { checkIn, checkOut };
};

export const calculateNights = (checkIn, checkOut) =>
  Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / MS_PER_DAY));

/**
 * Validates the raw guests value and, if a room is supplied, enforces the
 * room's maxGuests capacity. Throws a { status, message } error object,
 * consistent with parseAndValidateDates.
 */
export const parseAndValidateGuests = (guests, room = null) => {
  const guestCount = Number(guests);

  if (!Number.isInteger(guestCount) || guestCount < 1) {
    throw { status: 400, message: "guests must be a positive whole number" };
  }

  if (room && guestCount > room.maxGuests) {
    throw {
      status: 400,
      message: `This room supports at most ${room.maxGuests} guest${room.maxGuests > 1 ? "s" : ""}`,
    };
  }

  return guestCount;
};

/**
 * A room is unavailable for the requested range if any non-cancelled
 * booking for that room overlaps it. Standard interval-overlap check:
 * existing.checkIn < requested.checkOut AND existing.checkOut > requested.checkIn
 *
 * excludeBookingId lets callers re-verify without counting the booking
 * they're currently trying to confirm (used for the post-insert race check).
 */
export const isRoomAvailable = async (roomId, checkIn, checkOut, excludeBookingId = null) => {
  const query = {
    room: roomId,
    status: { $ne: "cancelled" },
    checkInDate: { $lt: checkOut },
    checkOutDate: { $gt: checkIn },
  };

  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const overlapping = await Booking.find(query).select("_id createdAt").lean();
  return { available: overlapping.length === 0, overlapping };
};

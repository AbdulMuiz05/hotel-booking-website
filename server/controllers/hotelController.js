import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import User from "../models/User.js";
import Review from "../models/Review.js";
import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import { isValidObjectId } from "../middleware/validateObjectId.js";
import { sendError } from "../utils/sendError.js";
import { parseAndValidateDates, parseAndValidateGuests, isRoomAvailable } from "../utils/availability.js";

const clean = (value, max = 500) => String(value ?? "").trim().slice(0, max);

const uploadHotelImages = async files => {
  const uploaded = [];
  try {
    for (const file of files || []) {
      const result = await cloudinary.uploader.upload(file.path, { folder: "quickstay/hotels" });
      uploaded.push(result.secure_url);
    }
    return uploaded;
  } catch (error) {
    await deleteCloudinaryImages(uploaded);
    throw error;
  } finally {
    await Promise.all((files || []).map(file => fs.unlink(file.path).catch(() => {})));
  }
};

const getCloudinaryPublicId = url => {
  try {
    const pathname = new URL(url).pathname;
    const marker = "/upload/";
    const index = pathname.indexOf(marker);
    if (index === -1) return null;
    let value = pathname.slice(index + marker.length);
    value = value.replace(/^v\d+\//, "");
    return value.replace(/\.[^/.]+$/, "");
  } catch {
    return null;
  }
};

const deleteCloudinaryImages = async urls => {
  await Promise.all((urls || []).map(async url => {
    const publicId = getCloudinaryPublicId(url);
    if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
  }));
};

export const registerHotel = async (req, res) => {
  try {
    const { name, address, contact, city, description = "" } = req.body;
    if (!clean(name) || !clean(address) || !clean(contact) || !clean(city)) {
      return res.status(400).json({ success: false, message: "Name, address, contact and city are required" });
    }
    if (await Hotel.exists({ owner: req.user._id })) {
      return res.status(409).json({ success: false, message: "Hotel already registered for this account" });
    }
    const images = await uploadHotelImages(req.files);
    try {
      const hotel = await Hotel.create({
        name: clean(name, 120), address: clean(address, 250), contact: clean(contact, 40),
        city: clean(city, 80), description: clean(description, 2000), owner: req.user._id,
        images
      });
      await User.findByIdAndUpdate(req.user._id, { role: "hotelOwner" });
      res.status(201).json({ success: true, message: "Hotel registered successfully", hotel });
    } catch (error) {
      await deleteCloudinaryImages(images);
      throw error;
    }
  } catch (error) { sendError(res, error); }
};

export const getHotels = async (req, res) => {
  try {
    const { city, guests, checkInDate, checkOutDate } = req.query;
    const filter = {};

    if (city?.trim()) {
      const cityValue = clean(city, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (cityValue) filter.city = { $regex: cityValue, $options: "i" };
    }

    const guestCount = guests !== undefined && guests !== "" ? Number(guests) : null;
    if (guestCount !== null && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20)) {
      return res.status(400).json({ success: false, message: "Invalid guest count" });
    }

    if ((checkInDate && !checkOutDate) || (!checkInDate && checkOutDate)) {
      return res.status(400).json({ success: false, message: "Both check-in and check-out dates are required" });
    }

    const hotels = await Hotel.find(filter).sort({ createdAt: -1 }).lean();
    const ids = hotels.map(h => h._id);

    let rooms = await Room.find({
      hotel: { $in: ids },
      isAvailable: true,
      ...(guestCount !== null ? { maxGuests: { $gte: guestCount } } : {})
    }).sort({ pricePerNight: 1, createdAt: -1 }).lean();

    if (checkInDate && checkOutDate) {
      const { checkIn, checkOut } = parseAndValidateDates(checkInDate, checkOutDate);
      const available = [];
      for (const room of rooms) {
        if ((await isRoomAvailable(room._id, checkIn, checkOut)).available) available.push(room);
      }
      rooms = available;
    }

    const roomsByHotel = new Map();
    for (const room of rooms) {
      const key = String(room.hotel);
      if (!roomsByHotel.has(key)) roomsByHotel.set(key, []);
      roomsByHotel.get(key).push(room);
    }

    const ratings = await Review.aggregate([
      { $match: { hotel: { $in: ids } } },
      { $group: { _id: "$hotel", averageRating: { $avg: "$rating" }, count: { $sum: 1 } } }
    ]);
    const ratingMap = Object.fromEntries(
      ratings.map(x => [String(x._id), { averageRating: Math.round(x.averageRating * 10) / 10, reviewCount: x.count }])
    );

    const result = hotels.map(hotel => {
      const hotelRooms = roomsByHotel.get(String(hotel._id)) || [];
      return {
        ...hotel,
        rooms: hotelRooms,
        availableRooms: hotelRooms.length,
        ...(ratingMap[String(hotel._id)] || { averageRating: 0, reviewCount: 0 })
      };
    }).filter(hotel => !guests && !checkInDate ? true : hotel.availableRooms > 0);

    res.json({ success: true, hotels: result });
  } catch (error) {
    sendError(res, error);
  }
};
export const getHotelById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid hotel id" });
    const hotel = await Hotel.findById(req.params.id).lean();
    if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found" });
    let rooms = await Room.find({ hotel: hotel._id, isAvailable: true }).sort({ createdAt: -1 }).lean();
    const { checkInDate, checkOutDate, guests } = req.query;
    let guestCount = null;
    if (guests !== undefined && guests !== "") {
      guestCount = Number(guests);
      if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
        return res.status(400).json({ success: false, message: "Invalid guest count" });
      }
    }
    if (checkInDate || checkOutDate) {
      if (!checkInDate || !checkOutDate) {
        return res.status(400).json({ success: false, message: "Both check-in and check-out dates are required" });
      }
      const { checkIn, checkOut } = parseAndValidateDates(checkInDate, checkOutDate);
      const filtered = [];
      for (const room of rooms) {
        if (guestCount !== null && guestCount > room.maxGuests) continue;
        if ((await isRoomAvailable(room._id, checkIn, checkOut)).available) filtered.push(room);
      }
      rooms = filtered;
    } else if (guestCount !== null) {
      rooms = rooms.filter(room => guestCount <= room.maxGuests);
    }
    const rating = await Review.aggregate([{ $match: { hotel: hotel._id } }, { $group: { _id: null, averageRating: { $avg: "$rating" }, reviewCount: { $sum: 1 } } }]);
    const stats = rating[0] || { averageRating: 0, reviewCount: 0 };
    res.json({ success: true, hotel: { ...hotel, rooms, averageRating: stats.averageRating ? Math.round(stats.averageRating * 10) / 10 : 0, reviewCount: stats.reviewCount } });
  } catch (error) { sendError(res, error); }
};

export const getOwnerHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.user._id });
    if (!hotel) return res.status(404).json({ success: false, message: "No hotel found for this account" });
    res.json({ success: true, hotel });
  } catch (error) { sendError(res, error); }
};

export const updateHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, owner: req.user._id });
    if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found or not authorized" });
    const { name, address, contact, city, description } = req.body;
    if (name !== undefined) hotel.name = clean(name, 120);
    if (address !== undefined) hotel.address = clean(address, 250);
    if (contact !== undefined) hotel.contact = clean(contact, 40);
    if (city !== undefined) hotel.city = clean(city, 80);
    if (description !== undefined) hotel.description = clean(description, 2000);

    const files = req.files || [];
    let keepImages = [];
    if (req.body.keepImages !== undefined) {
      try {
        const parsed = JSON.parse(req.body.keepImages);
        if (Array.isArray(parsed)) {
          const current = new Set(hotel.images || []);
          keepImages = parsed.map(x => clean(x, 1000)).filter(x => current.has(x)).slice(0, 8);
        }
      } catch {
        return res.status(400).json({ success: false, message: "Invalid keepImages value" });
      }
    } else if (!files.length) {
      keepImages = hotel.images || [];
    }

    let newImages = [];
    if (files.length) newImages = await uploadHotelImages(files);
    const nextImages = [...keepImages, ...newImages];
    if (nextImages.length > 8) {
      await deleteCloudinaryImages(newImages);
      return res.status(400).json({ success: false, message: "A hotel can have a maximum of 8 images" });
    }
    const removedImages = (hotel.images || []).filter(url => !nextImages.includes(url));
    hotel.images = nextImages;
    try {
      await hotel.save();
    } catch (error) {
      await deleteCloudinaryImages(newImages);
      throw error;
    }
    if (removedImages.length) await deleteCloudinaryImages(removedImages);
    res.json({ success: true, message: "Hotel updated successfully", hotel });
  } catch (error) { sendError(res, error); }
};

export const deleteHotel = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ _id: req.params.id, owner: req.user._id });
    if (!hotel) return res.status(404).json({ success: false, message: "Hotel not found or not authorized" });
    const activeBookings = await (await import("../models/Booking.js")).default.countDocuments({ hotel: hotel._id, status: { $ne: "cancelled" }, checkOutDate: { $gt: new Date() } });
    if (activeBookings) return res.status(409).json({ success: false, message: "Cannot delete a hotel with active bookings" });
    const historicalBookings = await (await import("../models/Booking.js")).default.countDocuments({ hotel: hotel._id });
    const historicalReviews = await Review.countDocuments({ hotel: hotel._id });
    if (historicalBookings || historicalReviews) {
      return res.status(409).json({ success: false, message: "This hotel has historical bookings or reviews and cannot be permanently deleted." });
    }
    const rooms = await Room.find({ hotel: hotel._id }).select("images").lean();
    await Room.deleteMany({ hotel: hotel._id });
    await Hotel.deleteOne({ _id: hotel._id });
    await deleteCloudinaryImages(rooms.flatMap(room => room.images || []));
    if (hotel.images?.length) await deleteCloudinaryImages(hotel.images);
    await User.findByIdAndUpdate(req.user._id, { role: "user" });
    res.json({ success: true, message: "Hotel deleted successfully" });
  } catch (error) { sendError(res, error); }
};

import fs from "fs/promises";
import { v2 as cloudinary } from "cloudinary";
import Hotel from "../models/Hotel.js";
import Room from "../models/Room.js";
import Booking from "../models/Booking.js";
import { sendError } from "../utils/sendError.js";
import { isValidObjectId } from "../middleware/validateObjectId.js";
import { parseAndValidateDates, isRoomAvailable } from "../utils/availability.js";

const ALLOWED_ROOM_TYPES = ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"];

const parseAmenities = value => {
  if (Array.isArray(value)) return value.map(String).map(x => x.trim()).filter(Boolean).slice(0, 12);
  try { return JSON.parse(value || "[]").map(String).map(x => x.trim()).filter(Boolean).slice(0, 12); }
  catch { return String(value || "").split(",").map(x => x.trim()).filter(Boolean).slice(0, 12); }
};

const parseRoomInput = (body) => {
  if (!ALLOWED_ROOM_TYPES.includes(body.roomType)) throw { status: 400, message: "Invalid room type" };
  const price = Number(body.pricePerNight);
  const maxGuests = Number(body.maxGuests);
  if (!Number.isFinite(price) || price <= 0) throw { status: 400, message: "Price per night must be a positive number" };
  if (!Number.isInteger(maxGuests) || maxGuests < 1 || maxGuests > 20) throw { status: 400, message: "Max guests must be between 1 and 20" };
  const amenities = parseAmenities(body.amenities);
  if (!amenities.length) throw { status: 400, message: "Select at least one amenity" };
  return { roomType: body.roomType, pricePerNight: price, maxGuests, amenities };
};

const uploadFiles = async files => {
  const uploaded = [];
  try {
    for (const file of files || []) {
      const result = await cloudinary.uploader.upload(file.path, { folder: "quickstay/rooms" });
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
    let value = pathname.slice(index + marker.length).replace(/^v\d+\//, "");
    return value.replace(/\.[^/.]+$/, "");
  } catch { return null; }
};

const deleteCloudinaryImages = async urls => {
  await Promise.all((urls || []).map(async url => {
    const publicId = getCloudinaryPublicId(url);
    if (publicId) await cloudinary.uploader.destroy(publicId).catch(() => {});
  }));
};

export const createRoom = async (req, res) => {
  try {
    const data = parseRoomInput(req.body);
    if (!req.files?.length) return res.status(400).json({ success: false, message: "At least one room image is required" });
    const hotel = await Hotel.findOne({ owner: req.user._id });
    if (!hotel) return res.status(404).json({ success: false, message: "No hotel found for this account" });
    const images = await uploadFiles(req.files);
    try {
      const room = await Room.create({ hotel: hotel._id, ...data, images });
      res.status(201).json({ success: true, message: "Room created successfully", room });
    } catch (error) {
      await deleteCloudinaryImages(images);
      throw error;
    }
  } catch (error) { sendError(res, error); }
};

export const getRooms = async (req, res) => {
  try {
    const { city, guests, checkInDate, checkOutDate, roomType } = req.query;
    const filter = { isAvailable: true };
    if (roomType && ALLOWED_ROOM_TYPES.includes(roomType)) filter.roomType = roomType;
    if (guests) {
      const n = Number(guests);
      if (!Number.isInteger(n) || n < 1) return res.status(400).json({ success: false, message: "Invalid guest count" });
      filter.maxGuests = { $gte: n };
    }
    const cityValue = city ? String(city).trim().slice(0, 80).replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : "";
    const hotels = cityValue ? await Hotel.find({ city: { $regex: cityValue, $options: "i" } }).select("_id").lean() : null;
    if (hotels) filter.hotel = { $in: hotels.map(h => h._id) };
    let rooms = await Room.find(filter).populate("hotel").sort({ createdAt: -1 }).lean();
    if (checkInDate && checkOutDate) {
      const { checkIn, checkOut } = parseAndValidateDates(checkInDate, checkOutDate);
      const available = [];
      for (const room of rooms) {
        if ((await isRoomAvailable(room._id, checkIn, checkOut)).available) available.push(room);
      }
      rooms = available;
    }
    res.json({ success: true, rooms });
  } catch (error) { sendError(res, error); }
};

export const getOwnerRooms = async (req, res) => {
  try {
    const hotel = await Hotel.findOne({ owner: req.user._id });
    if (!hotel) return res.status(404).json({ success: false, message: "No hotel found for this account" });
    const rooms = await Room.find({ hotel: hotel._id }).populate("hotel").sort({ createdAt: -1 });
    res.json({ success: true, rooms });
  } catch (error) { sendError(res, error); }
};

export const getRoomById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid room id" });
    const room = await Room.findById(req.params.id).populate("hotel").lean();
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    res.json({ success: true, room });
  } catch (error) { sendError(res, error); }
};

export const updateRoom = async (req, res) => {
  const files = req.files || [];
  try {
    const room = await Room.findById(req.params.id).populate("hotel");
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (String(room.hotel.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not authorized to modify this room" });
    const data = parseRoomInput(req.body);
    const oldImages = [...(room.images || [])];
    let newImages = [];
    let nextImages = oldImages;

    if (req.body.keepImages !== undefined) {
      try {
        const parsed = JSON.parse(req.body.keepImages);
        if (!Array.isArray(parsed)) throw new Error("not-array");
        const current = new Set(oldImages);
        const keptImages = parsed.map(x => String(x)).filter(x => current.has(x));
        nextImages = keptImages;
      } catch {
        return res.status(400).json({ success: false, message: "Invalid keepImages value" });
      }
    }

    if (files.length) newImages = await uploadFiles(files);
    if (nextImages.length + newImages.length > 4) {
      await deleteCloudinaryImages(newImages);
      return res.status(400).json({ success: false, message: "A room can have a maximum of 4 images" });
    }

    if (nextImages.length + newImages.length < 1) {
      await deleteCloudinaryImages(newImages);
      return res.status(400).json({ success: false, message: "A room must have at least one image" });
    }

    Object.assign(room, data, { images: [...nextImages, ...newImages] });
    try {
      await room.save();
    } catch (error) {
      await deleteCloudinaryImages(newImages);
      throw error;
    }

    const removedImages = oldImages.filter(url => !room.images.includes(url));
    if (removedImages.length) await deleteCloudinaryImages(removedImages);
    res.json({ success: true, message: "Room updated successfully", room });
  } catch (error) {
    await Promise.all(files.map(file => fs.unlink(file.path).catch(() => {})));
    sendError(res, error);
  }
};

export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate("hotel");
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (String(room.hotel.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not authorized to delete this room" });
    const historicalBookings = await Booking.countDocuments({ room: room._id });
    if (historicalBookings) return res.status(409).json({ success: false, message: "Cannot permanently delete a room with booking history. Mark it unavailable instead." });
    const images = [...(room.images || [])];
    await Room.deleteOne({ _id: room._id });
    await deleteCloudinaryImages(images);
    res.json({ success: true, message: "Room deleted successfully" });
  } catch (error) { sendError(res, error); }
};

export const toggleRoomAvailability = async (req, res) => {
  try {
    const { roomId } = req.body;
    if (!isValidObjectId(roomId)) return res.status(400).json({ success: false, message: "Invalid roomId" });
    const room = await Room.findById(roomId).populate("hotel");
    if (!room) return res.status(404).json({ success: false, message: "Room not found" });
    if (String(room.hotel.owner) !== String(req.user._id)) return res.status(403).json({ success: false, message: "Not authorized to modify this room" });
    room.isAvailable = !room.isAvailable;
    await room.save();
    res.json({ success: true, message: "Room availability updated", isAvailable: room.isAvailable });
  } catch (error) { sendError(res, error); }
};

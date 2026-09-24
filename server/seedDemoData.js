import "dotenv/config";
import connectDB from "./config/db.js";
import Hotel from "./models/Hotel.js";
import Room from "./models/Room.js";

const hotels = [
  {
    name: "Grand Horizon Dubai",
    address: "Sheikh Zayed Road, Dubai",
    contact: "+971 4 555 0101",
    owner: "seed-owner",
    city: "Dubai",
    description: "A modern city hotel close to Dubai's major attractions, shopping areas, and business districts.",
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    name: "Royal Palm New York",
    address: "Midtown Manhattan, New York",
    contact: "+1 212 555 0102",
    owner: "seed-owner",
    city: "New York",
    description: "A comfortable Manhattan stay with easy access to Times Square, Central Park, and major subway lines.",
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    name: "The London Crown",
    address: "Westminster, London",
    contact: "+44 20 5555 0103",
    owner: "seed-owner",
    city: "London",
    description: "A stylish London hotel offering a convenient base for sightseeing, business, and shopping.",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    name: "Marina Bay Suites",
    address: "Marina Bay, Singapore",
    contact: "+65 6555 0104",
    owner: "seed-owner",
    city: "Singapore",
    description: "A contemporary stay near Marina Bay with comfortable rooms and convenient city access.",
    images: ["https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    name: "Tokyo Sakura Hotel",
    address: "Shinjuku, Tokyo",
    contact: "+81 3 5555 0105",
    owner: "seed-owner",
    city: "Tokyo",
    description: "A clean and comfortable Tokyo stay near restaurants, shopping, and public transportation.",
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    name: "Paris Lumiere Hotel",
    address: "Central Paris, Paris",
    contact: "+33 1 5555 0106",
    owner: "seed-owner",
    city: "Paris",
    description: "A charming Paris stay with easy access to museums, cafes, shopping streets, and landmarks.",
    images: ["https://images.unsplash.com/photo-1564501049412-61c2a3083791?auto=format&fit=crop&w=1200&q=80"],
  },
];

const roomTemplates = [
  {
    roomType: "Double Bed",
    pricePerNight: 180,
    maxGuests: 2,
    amenities: ["Free WiFi", "Air Conditioning", "TV", "Breakfast"],
    images: ["https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80"],
  },
  {
    roomType: "Luxury Room",
    pricePerNight: 280,
    maxGuests: 3,
    amenities: ["Free WiFi", "Air Conditioning", "TV", "Mini Bar", "Room Service"],
    images: ["https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80"],
  },
];

await connectDB();

let createdHotels = [];
for (const data of hotels) {
  let hotel = await Hotel.findOne({ name: data.name, city: data.city });
  if (!hotel) hotel = await Hotel.create(data);
  createdHotels.push(hotel);

  const existingRooms = await Room.countDocuments({ hotel: hotel._id });
  if (existingRooms === 0) {
    await Room.insertMany(roomTemplates.map(room => ({ ...room, hotel: hotel._id, isAvailable: true })));
  }
}

const roomCount = await Room.countDocuments({ hotel: { $in: createdHotels.map(h => h._id) } });
console.log(`Seed complete: ${createdHotels.length} demo hotels and ${roomCount} rooms available.`);
process.exit(0);

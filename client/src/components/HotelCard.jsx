import { Link, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function HotelCard({ hotel }) {
  const { currency } = useAppContext();
  const [searchParams] = useSearchParams();
  const room = hotel.rooms?.[0];
  const detailQuery = new URLSearchParams();
  ["checkInDate", "checkOutDate", "guests"].forEach(key => { const value = searchParams.get(key); if (value) detailQuery.set(key, value); });
  const hotelHref = `/hotels/${hotel._id}${detailQuery.toString() ? `?${detailQuery.toString()}` : ""}`;
  const image = hotel.images?.[0] || room?.images?.[0];
  return <Link to={hotelHref} className="group overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl">
    <div className="relative h-56 overflow-hidden bg-gray-100">
      {image ? <img src={image} alt={hotel.name} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-105"/> : <div className="flex h-full items-center justify-center text-5xl text-gray-300">🏨</div>}
      <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/50 to-transparent"/>
      <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-gray-700 shadow-sm">{hotel.city}</span>
      {hotel.averageRating > 0 && <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-gray-800">★ {Number(hotel.averageRating).toFixed(1)}</span>}
    </div>
    <div className="p-5">
      <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate font-semibold text-gray-900">{hotel.name}</h3><p className="mt-1 truncate text-sm text-gray-500">{hotel.address}</p></div></div>
      <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4"><span className="text-sm text-gray-500">{hotel.availableRooms ?? hotel.rooms?.length ?? 0} room{(hotel.availableRooms ?? hotel.rooms?.length ?? 0) !== 1 ? "s" : ""}</span>{room && <span className="font-semibold text-gray-900">{currency}{room.pricePerNight}<span className="text-xs font-normal text-gray-500"> / night</span></span>}</div>
    </div>
  </Link>;
}

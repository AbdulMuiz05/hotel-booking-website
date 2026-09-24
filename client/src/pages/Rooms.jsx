import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";
import HotelCard from "../components/HotelCard";

const roomTypes = ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"];
const priceRanges = [
  { label: "Any price", min: 0, max: Infinity },
  { label: "Under $500", min: 0, max: 500 },
  { label: "$500 – $1,000", min: 500, max: 1000 },
  { label: "$1,000 – $2,000", min: 1000, max: 2000 },
  { label: "$2,000+", min: 2000, max: Infinity }
];

const Skeleton = () => <div className="overflow-hidden rounded-2xl border bg-white"><div className="h-56 animate-pulse bg-gray-200"/><div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-gray-200"/><div className="h-4 w-1/2 animate-pulse rounded bg-gray-100"/><div className="h-4 w-1/3 animate-pulse rounded bg-gray-100"/></div></div>;

export default function Rooms() {
  const { axios } = useAppContext();
  const [params] = useSearchParams();
  const city = params.get("city") || "";
  const guests = params.get("guests") || "1";
  const checkInDate = params.get("checkInDate") || "";
  const checkOutDate = params.get("checkOutDate") || "";
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFilters, setOpenFilters] = useState(true);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [priceIndex, setPriceIndex] = useState(0);
  const [sort, setSort] = useState("popular");

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({ guests, ...(city && { city }), ...(checkInDate && { checkInDate }), ...(checkOutDate && { checkOutDate }) });
        const { data } = await axios.get(`/api/rooms?${query.toString()}`);
        if (active && data.success) setRooms(data.rooms || []);
      } catch (error) {
        if (active) toast.error(error.response?.data?.message || "Unable to load rooms");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [axios, city, guests, checkInDate, checkOutDate]);

  const filteredRooms = useMemo(() => {
    const range = priceRanges[priceIndex];
    const result = rooms.filter(room => {
      const typeMatch = !selectedTypes.length || selectedTypes.includes(room.roomType);
      const price = Number(room.pricePerNight) || 0;
      return typeMatch && price >= range.min && price <= range.max;
    });
    return [...result].sort((a, b) => {
      if (sort === "price-low") return a.pricePerNight - b.pricePerNight;
      if (sort === "price-high") return b.pricePerNight - a.pricePerNight;
      if (sort === "name") return (a.hotel?.name || "").localeCompare(b.hotel?.name || "");
      return (b.hotel?.averageRating || 0) - (a.hotel?.averageRating || 0);
    });
  }, [rooms, selectedTypes, priceIndex, sort]);

  const groupedHotels = useMemo(() => [...new Map(filteredRooms.filter(r => r.hotel).map(room => {
    const existing = filteredRooms.filter(item => item.hotel?._id === room.hotel._id);
    return [room.hotel._id, { ...room.hotel, rooms: existing }];
  })).values()], [filteredRooms]);

  const toggleType = type => setSelectedTypes(current => current.includes(type) ? current.filter(item => item !== type) : [...current, type]);
  const clearFilters = () => { setSelectedTypes([]); setPriceIndex(0); setSort("popular"); };

  return <main className="min-h-screen bg-white">
    <section className="border-b bg-gray-50"><div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8"><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Explore rooms</p><h1 className="mt-2 text-3xl font-bold text-gray-900 sm:text-4xl">Find your perfect room</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Browse available rooms and refine your stay by room type, price and sorting preference.</p></div></section>
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-5 flex items-center justify-between gap-3 lg:hidden"><button onClick={() => setOpenFilters(v => !v)} className="rounded-xl border px-4 py-2 text-sm font-semibold">{openFilters ? "Hide filters" : "Show filters"}</button><button onClick={clearFilters} className="text-sm font-semibold text-primary">Clear</button></div>
      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <aside className={`${openFilters ? "block" : "hidden"} rounded-2xl border bg-white p-5 lg:block lg:h-fit lg:sticky lg:top-24`}>
          <div className="flex items-center justify-between"><h2 className="font-semibold text-gray-900">Filters</h2><button onClick={clearFilters} className="hidden text-xs font-semibold text-primary lg:block">Clear</button></div>
          <div className="mt-6"><h3 className="text-sm font-semibold text-gray-700">Room type</h3><div className="mt-3 space-y-3">{roomTypes.map(type => <label key={type} className="flex cursor-pointer items-center gap-3 text-sm text-gray-600"><input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} className="h-4 w-4 rounded border-gray-300"/>{type}</label>)}</div></div>
          <div className="mt-7"><h3 className="text-sm font-semibold text-gray-700">Price range</h3><div className="mt-3 space-y-3">{priceRanges.map((range, index) => <label key={range.label} className="flex cursor-pointer items-center gap-3 text-sm text-gray-600"><input type="radio" name="price" checked={priceIndex === index} onChange={() => setPriceIndex(index)} className="h-4 w-4"/>{range.label}</label>)}</div></div>
          <div className="mt-7"><h3 className="text-sm font-semibold text-gray-700">Sort by</h3><div className="mt-3 space-y-3">{[["popular", "Most popular"],["price-low", "Price: low to high"],["price-high", "Price: high to low"],["name", "Hotel name"]].map(([value, label]) => <label key={value} className="flex cursor-pointer items-center gap-3 text-sm text-gray-600"><input type="radio" name="sort" checked={sort === value} onChange={() => setSort(value)} className="h-4 w-4"/>{label}</label>)}</div></div>
        </aside>
        <div>
          <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-xl font-semibold text-gray-900">Hotel rooms</h2><p className="mt-1 text-sm text-gray-500">{loading ? "Finding available rooms..." : `${filteredRooms.length} room${filteredRooms.length !== 1 ? "s" : ""} available`}{city ? ` in ${city}` : ""}</p></div>{(checkInDate || checkOutDate) && <p className="text-sm text-gray-500">{checkInDate} to {checkOutDate} · {guests} guest{Number(guests) !== 1 ? "s" : ""}</p>}</div>
          {loading ? <div className="grid gap-6 sm:grid-cols-2">{[1,2,3,4].map(i => <Skeleton key={i}/>)}</div> : groupedHotels.length ? <div className="grid gap-6 sm:grid-cols-2">{groupedHotels.map(hotel => <HotelCard key={hotel._id} hotel={hotel}/>)}</div> : <div className="rounded-3xl border border-dashed p-12 text-center"><div className="text-4xl">🏨</div><h2 className="mt-4 text-xl font-semibold text-gray-900">No rooms match your filters</h2><p className="mt-2 text-sm text-gray-500">Try clearing a filter or choosing another destination, date range or guest count.</p><button onClick={clearFilters} className="mt-5 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white">Clear filters</button></div>}
        </div>
      </div>
    </section>
  </main>;
}

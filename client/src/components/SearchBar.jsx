import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

export default function SearchBar({ compact = false }) {
  const { searchedCities, axios, authHeaders } = useAppContext();
  const navigate = useNavigate();
  const [city, setCity] = useState(searchedCities?.[0] || "");
  const [checkInDate, setCheckInDate] = useState("");
  const [checkOutDate, setCheckOutDate] = useState("");
  const [guests, setGuests] = useState(1);
  const submit = async e => {
    e.preventDefault();
    if (!city.trim()) return toast.error("Enter a destination");
    if ((checkInDate && !checkOutDate) || (!checkInDate && checkOutDate)) return toast.error("Choose both check-in and check-out dates");
    if (checkInDate && new Date(checkOutDate) <= new Date(checkInDate)) return toast.error("Choose valid dates");
    if (!Number.isInteger(Number(guests)) || Number(guests) < 1 || Number(guests) > 20) return toast.error("Guests must be between 1 and 20");
    const params = new URLSearchParams({ city: city.trim(), guests: String(guests) });
    if (checkInDate) params.set("checkInDate", checkInDate);
    if (checkOutDate) params.set("checkOutDate", checkOutDate);
    if (axios && authHeaders) { try { const config = await authHeaders(); await axios.post("/api/user/store-recent-search", { recentSearchedCity: city.trim() }, config); } catch {} }
    navigate(`/hotels?${params.toString()}`);
  };
  const today = new Date().toISOString().slice(0, 10);
  return <form onSubmit={submit} className={`grid gap-1.5 rounded-2xl bg-white p-2 shadow-xl ${compact ? "sm:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-5"}`}>
    <div className="min-w-0 rounded-xl px-3 py-2.5"><label className="text-xs font-semibold text-gray-500">Destination</label><input value={city} onChange={e=>setCity(e.target.value)} placeholder="Where are you going?" className="mt-1 w-full min-w-0 bg-transparent text-sm outline-none" list="cities" /><datalist id="cities">{searchedCities?.map(c=><option key={c} value={c}/>)}</datalist></div>
    <div className="min-w-0 rounded-xl px-3 py-2.5 sm:border-l sm:border-gray-100"><label className="text-xs font-semibold text-gray-500">Check in</label><input type="date" min={today} value={checkInDate} onChange={e=>setCheckInDate(e.target.value)} className="mt-1 w-full min-w-0 bg-transparent text-sm outline-none"/></div>
    <div className="min-w-0 rounded-xl px-3 py-2.5 sm:border-l sm:border-gray-100"><label className="text-xs font-semibold text-gray-500">Check out</label><input type="date" min={checkInDate || today} value={checkOutDate} onChange={e=>setCheckOutDate(e.target.value)} className="mt-1 w-full min-w-0 bg-transparent text-sm outline-none"/></div>
    <div className="min-w-0 rounded-xl px-3 py-2.5 sm:border-l sm:border-gray-100"><label className="text-xs font-semibold text-gray-500">Guests</label><input type="number" min="1" max="20" value={guests} onChange={e=>setGuests(Math.max(1, Number(e.target.value)))} className="mt-1 w-full min-w-0 bg-transparent text-sm outline-none"/></div>
    <button className="rounded-xl bg-primary px-5 py-3 font-semibold text-white transition hover:bg-blue-700">Search stays</button>
  </form>;
}

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import HotelCard from "../components/HotelCard";
import SearchBar from "../components/SearchBar";
import { useAppContext } from "../context/AppContext";
import toast from "react-hot-toast";

const Skeleton = () => <div className="overflow-hidden rounded-2xl border bg-white"><div className="h-56 animate-pulse bg-gray-200"/><div className="space-y-3 p-5"><div className="h-5 w-2/3 animate-pulse rounded bg-gray-200"/><div className="h-4 w-1/2 animate-pulse rounded bg-gray-100"/><div className="h-4 w-1/3 animate-pulse rounded bg-gray-100"/></div></div>;

export default function Hotels() {
  const { axios } = useAppContext();
  const [params] = useSearchParams();
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const city = params.get("city") || "";
  const guests = params.get("guests") || "1";
  const inDate = params.get("checkInDate") || "";
  const outDate = params.get("checkOutDate") || "";

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const q = new URLSearchParams({ guests, ...(city && { city }), ...(inDate && { checkInDate: inDate }), ...(outDate && { checkOutDate: outDate }) });
        const { data } = await axios.get(`/api/hotels?${q}`);
        if (active && data.success) setHotels(data.hotels || []);
      } catch (e) { if (active) toast.error(e.response?.data?.message || e.message); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [city, guests, inDate, outDate]);

  const grouped = hotels;

  return <main className="min-h-screen bg-white">
    <section className="border-b bg-gray-50"><div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8"><SearchBar compact /></div></section>
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary">Hotel search</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">Find your perfect stay</h1>{inDate && <p className="mt-2 text-sm text-gray-500">{inDate} to {outDate} · {guests} guest{Number(guests) !== 1 ? "s" : ""}</p>}</div>{!loading && <p className="text-sm text-gray-500">{grouped.length} stay{grouped.length !== 1 ? "s" : ""} found</p>}</div>
      {loading ? <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i=><Skeleton key={i}/>)}</div> : grouped.length ? <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{grouped.map(h=><HotelCard key={h._id} hotel={h}/>)}</div> : <div className="mt-10 rounded-3xl border border-dashed p-10 text-center sm:p-16"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-3xl">🏨</div><h2 className="mt-5 text-xl font-semibold text-gray-900">No matching stays</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">Try another destination, date range, or guest count. You can also browse all available stays.</p></div>}
    </section>
  </main>;
}

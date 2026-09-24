import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import ReviewSection from "../components/ReviewSection";
import toast from "react-hot-toast";

const Skeleton = () => <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><div className="h-8 w-40 animate-pulse rounded bg-gray-200"/><div className="mt-6 h-72 animate-pulse rounded-3xl bg-gray-200"/><div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]"><div className="space-y-4"><div className="h-10 w-2/3 animate-pulse rounded bg-gray-200"/><div className="h-24 animate-pulse rounded bg-gray-100"/></div><div className="h-48 animate-pulse rounded-2xl bg-gray-100"/></div></main>;

export default function HotelDetails() {
  const { id } = useParams(); const [searchParams] = useSearchParams(); const { axios, currency } = useAppContext();
  const [hotel, setHotel] = useState(null); const [loading, setLoading] = useState(true); const [activeImage, setActiveImage] = useState(0);
  useEffect(() => {
    let active=true;
    (async()=>{
      try {
        const query = new URLSearchParams();
        const checkIn = searchParams.get("checkInDate") || "";
        const checkOut = searchParams.get("checkOutDate") || "";
        const guests = searchParams.get("guests") || "";
        if (checkIn && checkOut) {
          query.set("checkInDate", checkIn);
          query.set("checkOutDate", checkOut);
        }
        if (guests) query.set("guests", guests);
        const suffix = query.toString() ? `?${query.toString()}` : "";
        const {data}=await axios.get(`/api/hotels/${id}${suffix}`);
        if(active && data.success) setHotel(data.hotel);
      } catch(e){ if(active) toast.error(e.response?.data?.message||e.message); }
      finally{if(active)setLoading(false);}
    })();
    return ()=>{active=false};
  },[id, searchParams]);
  if(loading) return <Skeleton/>;
  if(!hotel) return <main className="mx-auto max-w-7xl px-4 py-20 text-center"><h1 className="text-2xl font-bold">Hotel not found</h1><Link to="/hotels" className="mt-4 inline-block font-semibold text-primary">Browse hotels →</Link></main>;
  const images = hotel.images?.length ? hotel.images : hotel.rooms?.flatMap(r=>r.images||[]).slice(0,6) || [];
  const rooms = hotel.rooms || [];
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <Link to="/hotels" className="text-sm font-medium text-gray-500 transition hover:text-primary">← Back to hotels</Link>
    <section className="mt-5 overflow-hidden rounded-3xl bg-gray-100">
      {images.length ? <><div className="relative h-64 sm:h-80 lg:h-[440px]"><img src={images[activeImage]} alt={hotel.name} className="h-full w-full object-cover"/><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5 sm:p-7"><span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-gray-800">{hotel.city}</span></div></div><div className="flex gap-2 overflow-x-auto bg-white p-3">{images.map((img,i)=><button key={img+i} onClick={()=>setActiveImage(i)} className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 sm:h-20 sm:w-24 ${activeImage===i ? "border-primary" : "border-transparent"}`} aria-label={`View image ${i+1}`}><img src={img} alt="" className="h-full w-full object-cover"/></button>)}</div></> : <div className="flex h-64 items-center justify-center text-6xl text-gray-300">🏨</div>}
    </section>
    <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
      <div><p className="text-sm font-semibold text-primary">{hotel.city}</p><h1 className="mt-2 text-4xl font-bold tracking-tight text-gray-900">{hotel.name}</h1><p className="mt-2 text-gray-500">{hotel.address}{hotel.contact ? ` · ${hotel.contact}` : ""}</p><p className="mt-6 leading-7 text-gray-600">{hotel.description || "A comfortable stay with carefully maintained rooms and helpful hospitality."}</p>
        <div className="mt-7 flex flex-wrap gap-3"><div className="rounded-xl bg-gray-50 px-4 py-3"><span className="text-xs text-gray-500">Rating</span><p className="mt-1 font-semibold">★ {hotel.averageRating ? Number(hotel.averageRating).toFixed(1) : "New"}</p></div><div className="rounded-xl bg-gray-50 px-4 py-3"><span className="text-xs text-gray-500">Rooms</span><p className="mt-1 font-semibold">{rooms.length}</p></div></div>
        <h2 className="mt-10 text-2xl font-bold">Available rooms</h2><div className="mt-5 space-y-4">{rooms.length ? rooms.map(r=><Link key={r._id} to={`/rooms/${r._id}${(() => { const q = new URLSearchParams(); ["checkInDate", "checkOutDate", "guests"].forEach(key => { const value = searchParams.get(key); if (value) q.set(key, value); }); return q.toString() ? `?${q.toString()}` : ""; })()}`} className="group flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition hover:border-primary/20 hover:shadow-md sm:flex-row"><img src={r.images?.[0]} alt={r.roomType} loading="lazy" className="h-44 w-full rounded-xl object-cover sm:w-56"/><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold text-gray-900">{r.roomType}</h3><p className="mt-1 text-sm text-gray-500">Up to {r.maxGuests} guests</p></div><span className="whitespace-nowrap font-bold">{currency}{r.pricePerNight}<small className="font-normal text-gray-500"> / night</small></span></div><div className="mt-4 flex flex-wrap gap-2">{(r.amenities||[]).map(a=><span key={a} className="rounded-full bg-gray-100 px-2.5 py-1 text-xs text-gray-600">{a}</span>)}</div></div></Link>) : <div className="rounded-2xl border border-dashed p-8 text-center text-gray-500">No rooms are currently available.</div>}</div>
        <ReviewSection hotelId={id} initialBookingId={searchParams.get("reviewBooking") || ""}/>
      </div>
      <aside className="h-fit rounded-2xl border border-gray-100 bg-gray-50 p-6 lg:sticky lg:top-24"><p className="text-sm font-semibold text-primary">Plan your stay</p><h3 className="mt-2 text-xl font-bold">Find the right room</h3><p className="mt-2 text-sm leading-6 text-gray-500">Compare room types, amenities, prices and real-time availability before booking.</p><Link to={rooms[0]?`/rooms/${rooms[0]._id}`:"/hotels"} className="mt-5 block rounded-xl bg-primary px-5 py-3 text-center font-semibold text-white transition hover:bg-blue-700">{rooms.length ? "Browse rooms" : "Browse hotels"}</Link></aside>
    </div>
  </main>;
}

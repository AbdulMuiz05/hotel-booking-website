import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";

export default function ExclusiveOffers(){
  const { axios, currency } = useAppContext();
  const [hotels,setHotels]=useState([]);
  useEffect(()=>{(async()=>{try{const {data}=await axios.get("/api/hotels");if(data.success)setHotels((data.hotels||[]).filter(h=>h.availableRooms>0).slice(0,3))}catch(e){console.warn(e.message)}})()},[]);
  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
    <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Special stays</p><h2 className="mt-2 text-3xl font-bold text-gray-900">Exclusive offers</h2><p className="mt-2 max-w-2xl text-gray-500">Discover handpicked stays and plan a comfortable getaway with QuickStay.</p></div>
      <Link to="/hotels" className="shrink-0 text-sm font-semibold text-primary">View all offers →</Link>
    </div>
    <div className="mt-8 grid gap-5 md:grid-cols-3">
      {hotels.length ? hotels.map((h,i)=><Link key={h._id} to={`/hotels/${h._id}`} className="group relative overflow-hidden rounded-2xl bg-gray-900">
        {h.images?.[0] || h.rooms?.[0]?.images?.[0] ? <img src={h.images?.[0] || h.rooms?.[0]?.images?.[0]} alt={h.name} loading="lazy" className="h-64 w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100"/> : <div className="h-64 bg-gray-200"/>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent"/><div className="absolute inset-x-0 bottom-0 p-5 text-white"><span className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-gray-800">{i===0?"Popular stay":i===1?"Great value":"Guest favorite"}</span><h3 className="mt-3 text-xl font-bold">{h.name}</h3><p className="mt-1 text-sm text-white/80">{h.city} · From {currency}{h.rooms?.[0]?.pricePerNight || 0}/night</p></div>
      </Link>) : <div className="md:col-span-3 rounded-2xl border border-dashed p-10 text-center text-gray-500">Exclusive offers will appear when hotels add rooms.</div>}
    </div>
  </section>;
}

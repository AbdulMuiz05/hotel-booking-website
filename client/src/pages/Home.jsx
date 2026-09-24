import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import SearchBar from "../components/SearchBar";
import HotelCard from "../components/HotelCard";
import ExclusiveOffers from "../components/ExclusiveOffers";
import Testimonials from "../components/Testimonials";
import Newsletter from "../components/Newsletter";
import { useAppContext } from "../context/AppContext";

export default function Home(){
 const {axios,searchedCities}=useAppContext();
 const [hotels,setHotels]=useState([]);
 const searchedCity=searchedCities?.[0] || "";
 useEffect(()=>{(async()=>{try{const {data}=await axios.get("/api/hotels");if(data.success)setHotels(data.hotels||[])}catch(e){console.warn(e.message)}})()},[]);
 const featured=hotels.slice(0,6);
 const recommended=searchedCity?hotels.filter(h=>h.city?.toLowerCase()===searchedCity.toLowerCase()).slice(0,3):[];
 return <main>
  <section className="relative overflow-hidden bg-slate-900">
   <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(0,113,194,.45),_transparent_45%)]"/>
   <div className="relative mx-auto max-w-7xl px-4 pb-28 pt-20 sm:px-6 lg:px-8 lg:pb-36 lg:pt-28">
    <div className="max-w-3xl text-white"><span className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium">Comfort. Choice. Confidence.</span><h1 className="mt-7 text-4xl font-bold leading-tight sm:text-6xl">Find a place you'll love to stay.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-slate-300">Discover comfortable rooms, compare prices, and book your next stay with a simple, secure experience.</p></div>
    <div className="mt-10 max-w-6xl"><SearchBar/></div>
   </div>
  </section>
  <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Explore stays</p><h2 className="mt-2 text-3xl font-bold text-gray-900">Featured hotels</h2></div><Link to="/hotels" className="text-sm font-semibold text-primary">View all →</Link></div>
  {featured.length?<div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{featured.map(h=><HotelCard key={h._id} hotel={h}/>)}</div>:<div className="mt-8 rounded-2xl border border-dashed p-10 text-center text-gray-500">No hotels are available right now.</div>}</section>
  {recommended.length>0&&<section className="bg-blue-50/60"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="flex items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Based on your search</p><h2 className="mt-2 text-3xl font-bold text-gray-900">Recommended hotels</h2><p className="mt-2 text-gray-500">Popular stays in {searchedCity}.</p></div><Link to={`/hotels?city=${encodeURIComponent(searchedCity)}&guests=1`} className="text-sm font-semibold text-primary">Explore {searchedCity} →</Link></div><div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{recommended.map(h=><HotelCard key={h._id} hotel={h}/>)}</div></div></section>}
  <section id="experience" className="bg-gray-50"><div className="mx-auto grid max-w-7xl gap-6 px-4 py-16 sm:px-6 md:grid-cols-3 lg:px-8"><div className="rounded-2xl bg-white p-7 shadow-sm"><div className="text-3xl">🔎</div><h3 className="mt-4 font-semibold">Search easily</h3><p className="mt-2 text-sm leading-6 text-gray-500">Find stays by destination, dates and guest capacity.</p></div><div className="rounded-2xl bg-white p-7 shadow-sm"><div className="text-3xl">🛏️</div><h3 className="mt-4 font-semibold">Choose confidently</h3><p className="mt-2 text-sm leading-6 text-gray-500">See room details, amenities, ratings and real availability.</p></div><div className="rounded-2xl bg-white p-7 shadow-sm"><div className="text-3xl">🔐</div><h3 className="mt-4 font-semibold">Book securely</h3><p className="mt-2 text-sm leading-6 text-gray-500">Your booking and payment status are verified on the server.</p></div></div></section>
  <ExclusiveOffers/>
  <Testimonials/>
  <Newsletter/>
 </main>
}

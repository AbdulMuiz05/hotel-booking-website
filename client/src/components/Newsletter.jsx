import { useState } from "react";
import toast from "react-hot-toast";

export default function Newsletter(){
  const [email,setEmail]=useState("");
  const submit=e=>{e.preventDefault();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))return toast.error("Enter a valid email address");localStorage.setItem("quickstay-newsletter",email.trim());toast.success("You're subscribed to QuickStay updates");setEmail("")};
  return <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><div className="overflow-hidden rounded-3xl bg-slate-900 px-6 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-10"><div className="max-w-2xl text-white"><p className="text-sm font-semibold uppercase tracking-wider text-blue-300">Stay in the loop</p><h2 className="mt-2 text-3xl font-bold">Get travel inspiration and special offers</h2><p className="mt-3 text-slate-300">Subscribe for useful travel updates, new stays and selected QuickStay offers.</p></div><form onSubmit={submit} className="mt-7 flex w-full max-w-xl flex-col gap-3 sm:flex-row lg:mt-0"><label className="sr-only" htmlFor="newsletter-email">Email address</label><input id="newsletter-email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Your email address" className="min-w-0 flex-1 rounded-xl border-0 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none ring-0"/><button className="rounded-xl bg-primary px-6 py-3.5 font-semibold text-white transition hover:bg-blue-700">Subscribe</button></form></div></section>;
}

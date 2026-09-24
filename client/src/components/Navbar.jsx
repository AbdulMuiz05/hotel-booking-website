import { useState } from "react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

export default function Navbar() {
  const { user, isOwner, setShowHotelReg } = useAppContext();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur">
    <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
      <Link to="/" onClick={close} className="text-2xl font-bold tracking-tight text-primary">Quick<span className="text-gray-800">Stay</span></Link>
      <nav className="hidden items-center gap-7 text-sm font-medium text-gray-600 md:flex">
        <Link to="/" className="transition hover:text-primary">Home</Link>
        <Link to="/hotels" className="transition hover:text-primary">Hotels</Link>
        <Link to="/rooms" className="transition hover:text-primary">Rooms</Link>
        <a href="/#experience" className="transition hover:text-primary">Experience</a>
        <a href="/#about" className="transition hover:text-primary">About</a>
        {user && <Link to="/my-bookings" className="transition hover:text-primary">My Bookings</Link>}
        {user && isOwner && <Link to="/owner/dashboard" className="transition hover:text-primary">Owner Dashboard</Link>}
      </nav>
      <div className="flex items-center gap-2 sm:gap-3">
        {user && !isOwner && <button onClick={() => setShowHotelReg(true)} className="hidden rounded-full border border-primary px-4 py-2 text-sm font-medium text-primary transition hover:bg-blue-50 sm:block">List your hotel</button>}
        {user ? <UserButton afterSignOutUrl="/" /> : <SignInButton mode="modal"><button className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90">Sign in</button></SignInButton>}
        <button onClick={() => setOpen(v => !v)} className="rounded-lg border border-gray-200 p-2 text-gray-700 md:hidden" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open}>☰</button>
      </div>
    </div>
    {open && <div className="border-t bg-white md:hidden">
      <nav className="mx-auto flex max-w-7xl flex-col px-4 py-3 sm:px-6">
        <Link onClick={close} to="/" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50">Home</Link>
        <Link onClick={close} to="/hotels" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50">Hotels</Link>
        <Link onClick={close} to="/rooms" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50">Rooms</Link>
        <a onClick={close} href="/#experience" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50">Experience</a>
        <a onClick={close} href="/#about" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50">About</a>
        {user && <Link onClick={close} to="/my-bookings" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50">My Bookings</Link>}
        {user && isOwner && <Link onClick={close} to="/owner/dashboard" className="rounded-lg px-3 py-3 text-sm font-medium hover:bg-gray-50">Owner Dashboard</Link>}
        {user && !isOwner && <button onClick={() => { setShowHotelReg(true); close(); }} className="rounded-lg px-3 py-3 text-left text-sm font-medium text-primary hover:bg-blue-50">List your hotel</button>}
        {!user && <button onClick={() => { navigate("/hotels"); close(); }} className="rounded-lg px-3 py-3 text-left text-sm font-medium hover:bg-gray-50">Explore hotels</button>}
      </nav>
    </div>}
  </header>;
}

import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";

const StatIcon = ({ type }) => {
  const paths = {
    bookings: "M7 3v3m10-3v3M4 9h16M6 5h12a2 2 0 0 1 2 2v11H4V7a2 2 0 0 1 2-2Z",
    rooms: "M4 20V8l8-4 8 4v12M8 20v-6h8v6M4 10h16",
    revenue: "M12 2v20M17 6.5c-.8-1-2.1-1.5-4-1.5-2.5 0-4 1.2-4 3s1.5 2.8 4 3.5 4 1.4 4 3.5-1.5 3.5-4.5 3.5c-2 0-3.5-.6-4.5-1.8",
    upcoming: "M8 2v4m8-4v4M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Z",
  };
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path strokeLinecap="round" strokeLinejoin="round" d={paths[type]} /></svg>;
};

const money = (value, currency) => `${currency}${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

export default function Dashboard() {
  const { axios, authHeaders, currency, user, hotel, navigate } = useAppContext();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/bookings/hotel", await authHeaders());
      if (response.data.success) setData(response.data.dashboardData);
    } catch (error) {
      toast.error(error.response?.data?.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const maxRevenue = useMemo(() => Math.max(...(data?.monthlyRevenue || []).map((item) => item.revenue), 1), [data]);

  if (loading) {
    return <div className="space-y-6"><div className="h-10 w-56 animate-pulse rounded bg-gray-200" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-gray-200" /></div>;
  }

  const stats = [
    ["Total bookings", data?.totalBookings, "bookings", "All bookings received"],
    ["Total rooms", data?.totalRooms, "rooms", `${data?.activeRooms || 0} currently available`],
    ["Total revenue", money(data?.totalRevenue, currency), "revenue", `${data?.paidBookings || 0} paid bookings`],
    ["Upcoming stays", data?.upcomingBookings, "upcoming", "Active future bookings"],
  ];

  return (
    <div className="space-y-7">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Owner workspace</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">{hotel?.name || "Your hotel"} · Here is today's business overview.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={loadDashboard} className="rounded-xl border bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">Refresh</button>
          <Link to="/owner/add-room" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90">+ Add room</Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(([label, value, icon, helper]) => (
          <div key={label} className="rounded-2xl border bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-sm font-medium text-gray-500">{label}</p><p className="mt-2 text-3xl font-bold text-gray-900">{value}</p></div>
              <div className="rounded-xl bg-primary/10 p-3 text-primary"><StatIcon type={icon} /></div>
            </div>
            <p className="mt-4 text-xs text-gray-500">{helper}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div><h2 className="text-lg font-semibold text-gray-900">Revenue overview</h2><p className="mt-1 text-sm text-gray-500">Paid booking revenue over the last 6 months.</p></div>
            <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">{money(data?.totalRevenue, currency)} total</span>
          </div>
          <div className="mt-7 flex h-56 items-end gap-2 sm:gap-4">
            {(data?.monthlyRevenue || []).map((item) => {
              const height = Math.max((item.revenue / maxRevenue) * 100, item.revenue ? 8 : 2);
              return <div key={`${item.label}-${item.year}`} className="flex h-full flex-1 flex-col items-center justify-end gap-2"><div className="flex h-full w-full items-end justify-center"><div title={money(item.revenue, currency)} className="w-full max-w-12 rounded-t-lg bg-primary/80 transition-all hover:bg-primary" style={{ height: `${height}%` }} /></div><span className="text-xs text-gray-500">{item.label}</span></div>;
            })}
          </div>
        </section>

        <section className="rounded-2xl border bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900">Booking status</h2>
          <p className="mt-1 text-sm text-gray-500">Current status across all bookings.</p>
          <div className="mt-6 space-y-5">
            {[['Confirmed', data?.confirmedBookings || 0, 'bg-green-500'], ['Pending', data?.pendingBookings || 0, 'bg-amber-500'], ['Cancelled', data?.cancelledBookings || 0, 'bg-gray-400']].map(([label, value, color]) => {
              const total = data?.totalBookings || 1;
              return <div key={label}><div className="mb-2 flex justify-between text-sm"><span className="font-medium text-gray-700">{label}</span><span className="text-gray-500">{value}</span></div><div className="h-2 overflow-hidden rounded-full bg-gray-100"><div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min((value / total) * 100, 100)}%` }} /></div></div>;
            })}
          </div>
          <div className="mt-7 grid grid-cols-2 gap-3 border-t pt-5"><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Available rooms</p><p className="mt-1 text-xl font-bold">{data?.activeRooms || 0}</p></div><div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Unavailable</p><p className="mt-1 text-xl font-bold">{data?.unavailableRooms || 0}</p></div></div>
        </section>
      </div>

      <section className="rounded-2xl border bg-white shadow-sm">
        <div className="flex flex-col justify-between gap-3 border-b p-5 sm:flex-row sm:items-center sm:p-6"><div><h2 className="text-lg font-semibold text-gray-900">Recent bookings</h2><p className="mt-1 text-sm text-gray-500">The latest reservations for your hotel.</p></div><Link to="/owner/bookings" className="text-sm font-semibold text-primary hover:underline">View all bookings →</Link></div>
        {!data?.bookings?.length ? <div className="p-12 text-center"><p className="font-medium text-gray-700">No bookings yet</p><p className="mt-1 text-sm text-gray-500">Your latest reservations will appear here.</p></div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500"><tr><th className="px-5 py-3">Guest</th><th className="px-5 py-3">Room</th><th className="px-5 py-3">Dates</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th></tr></thead><tbody>{data.bookings.slice(0, 8).map((b) => <tr key={b._id} className="border-t hover:bg-gray-50"><td className="px-5 py-4"><div className="font-medium text-gray-900">{b.user?.username || "Guest"}</div><div className="text-xs text-gray-500">{b.user?.email || ""}</div></td><td className="px-5 py-4">{b.room?.roomType || "Room"}</td><td className="px-5 py-4 whitespace-nowrap text-gray-600">{new Date(b.checkInDate).toLocaleDateString()} → {new Date(b.checkOutDate).toLocaleDateString()}</td><td className="px-5 py-4 font-semibold">{money(b.totalPrice, currency)}</td><td className="px-5 py-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${b.isPaid ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>{b.isPaid ? "Paid" : "Unpaid"}</span></td><td className="px-5 py-4 capitalize text-gray-600">{b.status}</td></tr>)}</tbody></table></div>}
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <button onClick={() => navigate("/owner/hotel")} className="rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="font-semibold text-gray-900">Manage hotel</p><p className="mt-1 text-sm text-gray-500">Update your hotel's details and gallery.</p></button>
        <button onClick={() => navigate("/owner/list-room")} className="rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="font-semibold text-gray-900">Manage rooms</p><p className="mt-1 text-sm text-gray-500">Edit rooms, prices and availability.</p></button>
        <button onClick={() => navigate("/owner/bookings")} className="rounded-2xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"><p className="font-semibold text-gray-900">Manage bookings</p><p className="mt-1 text-sm text-gray-500">Review reservations and payment status.</p></button>
      </section>
    </div>
  );
}

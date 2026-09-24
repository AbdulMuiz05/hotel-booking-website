import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const statusBadge = {
  pending: "bg-amber-100 text-amber-700",
  confirmed: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

const formatDate = (value) =>
  new Date(value).toLocaleDateString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const MyBookings = () => {
  const { axios, authHeaders, currency, user } = useAppContext();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [editForm, setEditForm] = useState({ checkInDate: "", checkOutDate: "", guests: 1 });

  const fetchBookings = async () => {
    try {
      const { data } = await axios.get("/api/bookings/user", await authHeaders());
      if (data.success) setBookings(data.bookings);
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const payNow = async (bookingId) => {
    try {
      setBusyId(bookingId);
      const { data } = await axios.post(
        `/api/bookings/${bookingId}/pay`,
        {},
        await authHeaders()
      );
      if (data.success) window.location.href = data.url;
      else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusyId(null);
    }
  };

  const cancelBooking = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    try {
      setBusyId(bookingId);
      const { data } = await axios.post(
        `/api/bookings/${bookingId}/cancel`,
        {},
        await authHeaders()
      );
      if (data.success) {
        toast.success(data.message);
        setSelectedBooking(null);
        await fetchBookings();
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusyId(null);
    }
  };

  const openEdit = (booking) => {
    setEditingBooking(booking);
    setEditForm({
      checkInDate: new Date(booking.checkInDate).toISOString().slice(0, 10),
      checkOutDate: new Date(booking.checkOutDate).toISOString().slice(0, 10),
      guests: booking.guests,
    });
    setSelectedBooking(null);
  };

  const updateBooking = async (event) => {
    event.preventDefault();
    if (!editForm.checkInDate || !editForm.checkOutDate) {
      toast.error("Please select both dates");
      return;
    }
    if (new Date(editForm.checkOutDate) <= new Date(editForm.checkInDate)) {
      toast.error("Check-out must be after check-in");
      return;
    }

    try {
      setBusyId(editingBooking._id);
      const { data } = await axios.put(
        `/api/bookings/${editingBooking._id}`,
        editForm,
        await authHeaders()
      );
      if (data.success) {
        toast.success("Booking updated successfully");
        setEditingBooking(null);
        await fetchBookings();
      } else toast.error(data.message);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusyId(null);
    }
  };

  const today = new Date().toISOString().slice(0, 10);

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-12"><div className="h-8 w-48 animate-pulse rounded bg-gray-200" /><div className="mt-6 h-40 animate-pulse rounded-2xl bg-gray-100" /></div>;
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:py-12">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-primary">Your trips</p>
          <h1 className="mt-1 text-3xl font-bold text-gray-900">My Bookings</h1>
          <p className="mt-1 text-sm text-gray-500">View, pay for, or manage your upcoming stays.</p>
        </div>
        <p className="text-sm text-gray-500">{bookings.length} booking{bookings.length === 1 ? "" : "s"}</p>
      </div>

      {bookings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 p-10 text-center">
          <h2 className="text-lg font-semibold text-gray-800">No bookings yet</h2>
          <p className="mt-2 text-sm text-gray-500">Find a room you like and your reservations will appear here.</p>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-5">
          {bookings.map((b) => {
            const canManage = b.status !== "cancelled" && !b.isPaid && new Date(b.checkInDate) > new Date();
            const canReview = b.status === "confirmed" && b.isPaid && new Date(b.checkOutDate) < new Date();
            const isBusy = busyId === b._id;
            return (
              <article key={b._id} className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="flex flex-col md:flex-row">
                  <img src={b.room?.images?.[0]} alt={b.room?.roomType || "Booked room"} className="h-52 w-full object-cover md:h-auto md:w-56" />
                  <div className="flex min-w-0 flex-1 flex-col p-5">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">{b.hotel?.city}</p>
                        <h2 className="mt-1 text-xl font-semibold text-gray-900">{b.hotel?.name}</h2>
                        <p className="mt-1 text-sm text-gray-500">{b.room?.roomType} · {b.hotel?.address}</p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadge[b.status] || "bg-gray-100 text-gray-700"}`}>{b.status}</span>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${b.isPaid ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{b.isPaid ? "Paid" : "Unpaid"}</span>
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 rounded-xl bg-gray-50 p-4 text-sm sm:grid-cols-4">
                      <div><p className="text-xs text-gray-500">Check-in</p><p className="mt-1 font-medium text-gray-800">{formatDate(b.checkInDate)}</p></div>
                      <div><p className="text-xs text-gray-500">Check-out</p><p className="mt-1 font-medium text-gray-800">{formatDate(b.checkOutDate)}</p></div>
                      <div><p className="text-xs text-gray-500">Guests</p><p className="mt-1 font-medium text-gray-800">{b.guests}</p></div>
                      <div><p className="text-xs text-gray-500">Total</p><p className="mt-1 font-semibold text-gray-900">{currency}{b.totalPrice}</p></div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs text-gray-500">{b.isPaid ? `Payment: ${b.paymentMethod}` : "Stripe payment pending"}</p>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={() => setSelectedBooking(b)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">View details</button>
                        {!b.isPaid && b.status !== "cancelled" && <button onClick={() => payNow(b._id)} disabled={isBusy} className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{isBusy ? "Processing..." : "Pay Now"}</button>}
                        {canManage && <button onClick={() => openEdit(b)} disabled={isBusy} className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50 disabled:opacity-60">Modify</button>}
                        {canManage && <button onClick={() => cancelBooking(b._id)} disabled={isBusy} className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60">Cancel</button>}
                        {canReview && <a href={`/hotels/${b.hotel?._id}?reviewBooking=${b._id}#reviews`} className="rounded-lg border border-primary px-4 py-2 text-sm font-medium text-primary hover:bg-blue-50">Review stay</a>}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedBooking(null)}>
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-sm font-semibold text-primary">Booking details</p><h2 className="mt-1 text-2xl font-bold text-gray-900">{selectedBooking.hotel?.name}</h2></div>
              <button onClick={() => setSelectedBooking(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">✕</button>
            </div>
            <div className="mt-6 grid gap-4 text-sm">
              <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Room</p><p className="mt-1 font-semibold">{selectedBooking.room?.roomType}</p><p className="mt-1 text-gray-500">Up to {selectedBooking.room?.maxGuests} guests · {currency}{selectedBooking.room?.pricePerNight} per night</p></div>
              <div className="grid grid-cols-2 gap-4"><div><p className="text-xs text-gray-500">Check-in</p><p className="mt-1 font-medium">{formatDate(selectedBooking.checkInDate)}</p></div><div><p className="text-xs text-gray-500">Check-out</p><p className="mt-1 font-medium">{formatDate(selectedBooking.checkOutDate)}</p></div><div><p className="text-xs text-gray-500">Guests</p><p className="mt-1 font-medium">{selectedBooking.guests}</p></div><div><p className="text-xs text-gray-500">Total</p><p className="mt-1 font-semibold">{currency}{selectedBooking.totalPrice}</p></div></div>
              <div className="rounded-xl border p-4"><p className="text-xs text-gray-500">Payment</p><p className="mt-1 font-medium">{selectedBooking.isPaid ? `Paid via ${selectedBooking.paymentMethod}` : "Unpaid — Stripe payment pending"}</p></div>
            </div>
            {selectedBooking.status !== "cancelled" && !selectedBooking.isPaid && new Date(selectedBooking.checkInDate) > new Date() && (
              <div className="mt-6 flex flex-col gap-2 sm:flex-row"><button onClick={() => openEdit(selectedBooking)} className="flex-1 rounded-xl border border-primary px-4 py-3 font-semibold text-primary hover:bg-blue-50">Modify booking</button><button onClick={() => cancelBooking(selectedBooking._id)} disabled={busyId === selectedBooking._id} className="flex-1 rounded-xl border border-red-300 px-4 py-3 font-semibold text-red-600 hover:bg-red-50">Cancel booking</button></div>
            )}
          </div>
        </div>
      )}

      {editingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setEditingBooking(null)}>
          <form onSubmit={updateBooking} className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between"><div><p className="text-sm font-semibold text-primary">Modify booking</p><h2 className="mt-1 text-2xl font-bold text-gray-900">{editingBooking.hotel?.name}</h2></div><button type="button" onClick={() => setEditingBooking(null)} className="rounded-full p-2 text-gray-500 hover:bg-gray-100" aria-label="Close">✕</button></div>
            <p className="mt-2 text-sm text-gray-500">Your booking is currently unpaid. Changing the dates or guest count will require you to pay again using the updated total.</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-gray-700">Check-in<input required type="date" min={today} value={editForm.checkInDate} onChange={(e) => setEditForm({ ...editForm, checkInDate: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
              <label className="text-sm font-medium text-gray-700">Check-out<input required type="date" min={editForm.checkInDate || today} value={editForm.checkOutDate} onChange={(e) => setEditForm({ ...editForm, checkOutDate: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" /></label>
              <label className="text-sm font-medium text-gray-700 sm:col-span-2">Guests<input required type="number" min="1" max={editingBooking.room?.maxGuests || 1} value={editForm.guests} onChange={(e) => setEditForm({ ...editForm, guests: Number(e.target.value) })} className="mt-1 w-full rounded-lg border px-3 py-2" /><span className="mt-1 block text-xs text-gray-500">Maximum {editingBooking.room?.maxGuests} guests</span></label>
            </div>
            <div className="mt-6 flex gap-3"><button type="button" onClick={() => setEditingBooking(null)} className="flex-1 rounded-xl border px-4 py-3 font-medium text-gray-700 hover:bg-gray-50">Keep current</button><button type="submit" disabled={busyId === editingBooking._id} className="flex-1 rounded-xl bg-primary px-4 py-3 font-semibold text-white hover:bg-primary/90 disabled:opacity-60">{busyId === editingBooking._id ? "Saving..." : "Save changes"}</button></div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MyBookings;

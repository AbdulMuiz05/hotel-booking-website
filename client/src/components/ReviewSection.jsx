import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

export default function ReviewSection({ hotelId, initialBookingId = "" }) {
  const { axios, authHeaders, user } = useAppContext();
  const [reviews, setReviews] = useState([]);
  const [average, setAverage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(initialBookingId);
  const [myReviews, setMyReviews] = useState({});
  const [form, setForm] = useState({ rating: 5, comment: "" });
  const [busy, setBusy] = useState(false);

  const loadReviews = async () => {
    try {
      const { data } = await axios.get(`/api/reviews/hotel/${hotelId}`);
      if (data.success) {
        setReviews(data.reviews);
        setAverage(data.averageRating);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  const loadEligibleBookings = async () => {
    if (!user) {
      setEligibleBookings([]);
      setMyReviews({});
      return;
    }

    try {
      const { data } = await axios.get("/api/bookings/user", await authHeaders());
      if (!data.success) return;

      const now = new Date();
      const completed = data.bookings.filter(
        (booking) =>
          String(booking.hotel?._id) === String(hotelId) &&
          booking.isPaid &&
          booking.status === "confirmed" &&
          new Date(booking.checkOutDate) < now
      );

      const reviewEntries = await Promise.all(
        completed.map(async (booking) => {
          try {
            const { data: reviewData } = await axios.get(
              `/api/reviews/my/${booking._id}`,
              await authHeaders()
            );
            return [booking._id, reviewData.review || null];
          } catch {
            return [booking._id, null];
          }
        })
      );

      const reviewMap = Object.fromEntries(reviewEntries);
      setEligibleBookings(completed);
      setMyReviews(reviewMap);

      const requested = completed.find(
        (booking) => String(booking._id) === String(initialBookingId)
      );
      const firstUnreviewed = completed.find((booking) => !reviewMap[booking._id]);
      const fallback = requested || firstUnreviewed || completed[0];
      setSelectedBookingId((current) => {
        if (current && completed.some((booking) => String(booking._id) === String(current))) {
          return current;
        }
        return fallback?._id || "";
      });
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadReviews(), loadEligibleBookings()]).finally(() => setLoading(false));
  }, [hotelId, user]);

  const selectedReview = selectedBookingId ? myReviews[selectedBookingId] : null;
  const selectedBooking = useMemo(
    () => eligibleBookings.find((booking) => String(booking._id) === String(selectedBookingId)),
    [eligibleBookings, selectedBookingId]
  );

  useEffect(() => {
    if (selectedReview) {
      setForm({ rating: selectedReview.rating, comment: selectedReview.comment });
    } else {
      setForm({ rating: 5, comment: "" });
    }
  }, [selectedBookingId, selectedReview]);

  const submit = async (event) => {
    event.preventDefault();
    if (!selectedBookingId) return toast.error("Select a completed stay first");

    try {
      setBusy(true);
      const config = await authHeaders();
      const payload = {
        rating: Number(form.rating),
        comment: form.comment.trim(),
      };

      const { data } = selectedReview
        ? await axios.put(`/api/reviews/${selectedReview._id}`, payload, config)
        : await axios.post(
            `/api/reviews/hotel/${hotelId}`,
            { bookingId: selectedBookingId, ...payload },
            config
          );

      if (data.success) {
        toast.success(data.message);
        await Promise.all([loadReviews(), loadEligibleBookings()]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  const deleteReview = async () => {
    if (!selectedReview || !window.confirm("Delete your review?")) return;

    try {
      setBusy(true);
      const { data } = await axios.delete(`/api/reviews/${selectedReview._id}`, await authHeaders());
      if (data.success) {
        toast.success(data.message);
        await Promise.all([loadReviews(), loadEligibleBookings()]);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section id="reviews" className="mt-12 border-t pt-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Guest reviews</p>
          <h2 className="mt-1 text-2xl font-bold">What guests say</h2>
        </div>
        <div className="rounded-2xl bg-blue-50 px-5 py-3 text-center">
          <div className="text-2xl font-bold text-primary">{average || "—"}</div>
          <div className="text-xs text-gray-500">
            {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {user && eligibleBookings.length > 0 && (
        <form onSubmit={submit} className="mt-6 rounded-2xl border bg-gray-50 p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold">{selectedReview ? "Edit your review" : "Share your experience"}</h3>
              <p className="mt-1 text-xs text-gray-500">
                {selectedReview ? "Update your rating or comment for this stay." : "Your completed stay makes you eligible to review this hotel."}
              </p>
            </div>
            {selectedReview && (
              <button
                type="button"
                onClick={deleteReview}
                disabled={busy}
                className="text-sm font-semibold text-red-600 hover:text-red-700 disabled:opacity-60"
              >
                Delete review
              </button>
            )}
          </div>

          {eligibleBookings.length > 1 && (
            <select
              value={selectedBookingId}
              onChange={(event) => setSelectedBookingId(event.target.value)}
              className="mt-4 w-full rounded-lg border px-3 py-2 outline-primary"
            >
              {eligibleBookings.map((booking) => (
                <option key={booking._id} value={booking._id}>
                  Stay: {new Date(booking.checkInDate).toLocaleDateString()} → {new Date(booking.checkOutDate).toLocaleDateString()}
                  {myReviews[booking._id] ? " — reviewed" : " — ready for review"}
                </option>
              ))}
            </select>
          )}

          {selectedBooking && (
            <p className="mt-3 text-xs text-gray-500">
              Stay: {new Date(selectedBooking.checkInDate).toLocaleDateString()} → {new Date(selectedBooking.checkOutDate).toLocaleDateString()}
            </p>
          )}

          <div className="mt-4 grid gap-3 sm:grid-cols-[180px_1fr]">
            <select
              value={form.rating}
              onChange={(event) => setForm({ ...form, rating: Number(event.target.value) })}
              className="rounded-lg border px-3 py-2"
            >
              <option value={5}>★★★★★ 5</option>
              <option value={4}>★★★★☆ 4</option>
              <option value={3}>★★★☆☆ 3</option>
              <option value={2}>★★☆☆☆ 2</option>
              <option value={1}>★☆☆☆☆ 1</option>
            </select>
            <textarea
              value={form.comment}
              onChange={(event) => setForm({ ...form, comment: event.target.value })}
              rows="3"
              maxLength="1000"
              placeholder="Share your experience..."
              className="w-full rounded-lg border px-3 py-2 outline-primary"
            />
          </div>

          <button
            disabled={busy}
            className="mt-3 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? "Saving..." : selectedReview ? "Update review" : "Submit review"}
          </button>
        </form>
      )}

      {user && !loading && eligibleBookings.length === 0 && (
        <div className="mt-6 rounded-2xl border border-dashed p-5 text-sm text-gray-500">
          You can leave a review after completing and paying for a stay at this hotel.
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-gray-500">Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed p-6 text-sm text-gray-500">
          No reviews yet. Be the first guest to share your experience.
        </div>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <article key={review._id} className="rounded-2xl border p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold">{review.user?.username || "Guest"}</div>
                <div className="text-sm text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                  {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-gray-600">{review.comment}</p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

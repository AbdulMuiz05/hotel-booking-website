import { useCallback, useEffect, useState } from "react";
import { useAppContext } from "../../context/AppContext";
import toast from "react-hot-toast";
import HotelImagePicker from "../../components/HotelImagePicker";

export default function ManageHotel() {
  const { axios, authHeaders, hotel, setHotel } = useAppContext();
  const [form, setForm] = useState({ name: "", address: "", contact: "", city: "", description: "" });
  const [imageState, setImageState] = useState({ keptImages: [], newFiles: [] });
  const [busy, setBusy] = useState(false);
  const handleImagesChange = useCallback((value) => setImageState(value), []);

  useEffect(() => {
    if (hotel) {
      setForm({ name: hotel.name || "", address: hotel.address || "", contact: hotel.contact || "", city: hotel.city || "", description: hotel.description || "" });
      setImageState({ keptImages: hotel.images || [], newFiles: [] });
    }
  }, [hotel]);

  const save = async e => {
    e.preventDefault();
    if (!hotel) return;
    try {
      setBusy(true);
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      formData.append("keepImages", JSON.stringify(imageState.keptImages));
      imageState.newFiles.forEach(file => formData.append("images", file));
      const r = await axios.put(`/api/hotels/${hotel._id}`, formData, await authHeaders());
      if (r.data.success) {
        setHotel(r.data.hotel);
        setImageState({ keptImages: r.data.hotel.images || [], newFiles: [] });
        toast.success(r.data.message);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    } finally {
      setBusy(false);
    }
  };

  const del = async () => {
    if (!hotel || !confirm("Delete this hotel? This cannot be undone.")) return;
    try {
      const r = await axios.delete(`/api/hotels/${hotel._id}`, await authHeaders());
      if (r.data.success) {
        toast.success(r.data.message);
        location.href = "/";
      }
    } catch (e) {
      toast.error(e.response?.data?.message || e.message);
    }
  };

  if (!hotel) return <p className="text-gray-500">No hotel found.</p>;

  return (
    <div className="max-w-3xl">
      <h1 className="text-3xl font-bold">Manage hotel</h1>
      <p className="mt-1 text-gray-500">Keep your property information and photos up to date.</p>
      <form onSubmit={save} className="mt-7 space-y-5 rounded-2xl border bg-white p-6">
        {["name", "address", "contact", "city"].map(k => (
          <label key={k} className="block text-sm font-medium capitalize">
            {k}
            <input value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 outline-primary" required />
          </label>
        ))}
        <label className="block text-sm font-medium">
          Description
          <textarea rows="5" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 outline-primary" />
        </label>
        <div>
          <p className="text-sm font-medium">Hotel images</p>
          <div className="mt-2">
            <HotelImagePicker existingImages={hotel.images || []} onChange={handleImagesChange} max={8} />
          </div>
        </div>
        <button disabled={busy} className="rounded-xl bg-primary px-5 py-2.5 font-semibold text-white disabled:opacity-60">{busy ? "Saving..." : "Save hotel"}</button>
      </form>
      <button onClick={del} className="mt-6 rounded-xl border border-red-200 px-5 py-2.5 font-semibold text-red-600">Delete hotel</button>
    </div>
  );
}

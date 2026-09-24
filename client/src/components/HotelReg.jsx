import { useCallback, useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../context/AppContext";
import HotelImagePicker from "./HotelImagePicker";

const CITIES = ["New York", "London", "Dubai", "Singapore", "Tokyo", "Paris"];

const HotelReg = () => {
  const { setShowHotelReg, axios, authHeaders, setIsOwner, fetchHotel } = useAppContext();

  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [description, setDescription] = useState("");
  const [imageState, setImageState] = useState({ keptImages: [], newFiles: [] });
  const [loading, setLoading] = useState(false);
  const handleImagesChange = useCallback((value) => setImageState(value), []);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    if (!name || !contact || !address || !city) {
      toast.error("Please fill in all the details");
      return;
    }

    try {
      setLoading(true);
      if (!imageState.newFiles.length) {
        toast.error("Please add at least one hotel image");
        return;
      }
      const formData = new FormData();
      formData.append("name", name);
      formData.append("contact", contact);
      formData.append("address", address);
      formData.append("city", city);
      formData.append("description", description);
      imageState.newFiles.forEach(file => formData.append("images", file));
      const { data } = await axios.post("/api/hotels", formData, await authHeaders());

      if (data.success) {
        toast.success(data.message);
        setIsOwner(true); await fetchHotel();
        setImageState({ keptImages: [], newFiles: [] });
        setShowHotelReg(false);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onClick={() => setShowHotelReg(false)}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={onSubmitHandler}
        className="relative w-full max-w-md rounded-xl bg-white p-8 text-gray-600"
      >
        <button
          type="button"
          onClick={() => setShowHotelReg(false)}
          className="absolute right-4 top-4 text-xl text-gray-400 hover:text-gray-700"
        >
          &times;
        </button>

        <p className="mb-6 text-2xl font-semibold text-gray-800">Register Your Hotel</p>

        <div className="mb-4">
          <label htmlFor="name" className="font-medium text-gray-700">
            Hotel Name
          </label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Type here"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 outline-primary"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="contact" className="font-medium text-gray-700">
            Phone
          </label>
          <input
            id="contact"
            type="text"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Type here"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 outline-primary"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="address" className="font-medium text-gray-700">
            Address
          </label>
          <input
            id="address"
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Type here"
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 outline-primary"
            required
          />
        </div>

        <div className="mb-4">
          <label htmlFor="description" className="font-medium text-gray-700">Description</label>
          <textarea id="description" rows="3" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell guests about your hotel" className="mt-1 w-full rounded border border-gray-300 px-3 py-2 outline-primary" />
        </div>

        <div className="mb-6">
          <label className="font-medium text-gray-700">Hotel Images</label>
          <div className="mt-2">
            <HotelImagePicker existingImages={[]} onChange={handleImagesChange} max={8} />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="city" className="font-medium text-gray-700">
            City
          </label>
          <select
            id="city"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2 outline-primary"
            required
          >
            <option value="">Select City</option>
            {CITIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-primary py-2.5 font-medium text-white transition hover:bg-primary/90 disabled:opacity-60"
        >
          {loading ? "Registering..." : "Register"}
        </button>
      </form>
    </div>
  );
};

export default HotelReg;

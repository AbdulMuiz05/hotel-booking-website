import { useState } from "react";
import toast from "react-hot-toast";
import { useAppContext } from "../../context/AppContext";

const ROOM_TYPES = ["Single Bed", "Double Bed", "Luxury Room", "Family Suite"];
const ALL_AMENITIES = [
  "Free Wifi",
  "Free Breakfast",
  "Room Service",
  "Mountain View",
  "Pool Access",
];

const AddRoom = () => {
  const { axios, authHeaders } = useAppContext();

  const [images, setImages] = useState({ 1: null, 2: null, 3: null, 4: null });
  const [inputs, setInputs] = useState({
    roomType: "",
    pricePerNight: 0,
    maxGuests: 2,
    amenities: ALL_AMENITIES.reduce((acc, a) => ({ ...acc, [a]: false }), {}),
  });
  const [loading, setLoading] = useState(false);

  const toggleAmenity = (amenity) => {
    setInputs((prev) => ({
      ...prev,
      amenities: { ...prev.amenities, [amenity]: !prev.amenities[amenity] },
    }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const hasImage = Object.values(images).some(Boolean);
    if (!inputs.roomType || !inputs.pricePerNight || !inputs.maxGuests || !hasImage) {
      toast.error("Please fill in all the details");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("roomType", inputs.roomType);
      formData.append("pricePerNight", inputs.pricePerNight);
      formData.append("maxGuests", inputs.maxGuests);

      const enabledAmenities = Object.keys(inputs.amenities).filter(
        (key) => inputs.amenities[key]
      );
      formData.append("amenities", JSON.stringify(enabledAmenities));

      Object.keys(images).forEach((key) => {
        if (images[key]) formData.append("images", images[key]);
      });

      const { data } = await axios.post("/api/rooms", formData, await authHeaders());

      if (data.success) {
        toast.success(data.message);
        setInputs({
          roomType: "",
          pricePerNight: 0,
          maxGuests: 2,
          amenities: ALL_AMENITIES.reduce((acc, a) => ({ ...acc, [a]: false }), {}),
        });
        setImages({ 1: null, 2: null, 3: null, 4: null });
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
    <form onSubmit={onSubmitHandler}>
      <p className="text-lg font-medium">Add Room</p>
      <p className="mt-1 text-sm text-gray-500">
        Upload photos and provide the room details below.
      </p>

      <p className="mt-6 text-gray-800">Images</p>
      <div className="mt-2 flex flex-wrap gap-4">
        {Object.keys(images).map((key) => (
          <label htmlFor={`roomImage${key}`} key={key} className="cursor-pointer">
            <img
              src={images[key] ? URL.createObjectURL(images[key]) : ""}
              alt=""
              className={`h-24 w-24 rounded border border-dashed border-gray-300 object-cover ${
                images[key] ? "" : "bg-gray-50"
              }`}
            />
            <input
              type="file"
              accept="image/*"
              id={`roomImage${key}`}
              hidden
              onChange={(e) =>
                setImages((prev) => ({ ...prev, [key]: e.target.files[0] }))
              }
            />
          </label>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-6">
        <div>
          <p className="text-gray-800">Room Type</p>
          <select
            value={inputs.roomType}
            onChange={(e) => setInputs((prev) => ({ ...prev, roomType: e.target.value }))}
            className="mt-1 w-48 rounded border border-gray-300 px-3 py-2 outline-primary"
          >
            <option value="">Select Room Type</option>
            {ROOM_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="mt-1 text-gray-800">
            Price <span className="text-xs">/night</span>
          </p>
          <input
            type="number"
            min="0"
            placeholder="0"
            value={inputs.pricePerNight}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, pricePerNight: e.target.value }))
            }
            className="mt-1 w-32 rounded border border-gray-300 px-3 py-2 outline-primary"
          />
        </div>

        <div>
          <p className="mt-1 text-gray-800">Max Guests</p>
          <input
            type="number"
            min="1"
            placeholder="2"
            value={inputs.maxGuests}
            onChange={(e) =>
              setInputs((prev) => ({ ...prev, maxGuests: e.target.value }))
            }
            className="mt-1 w-32 rounded border border-gray-300 px-3 py-2 outline-primary"
          />
        </div>
      </div>

      <p className="mt-6 text-gray-800">Amenities</p>
      <div className="mt-2 flex max-w-md flex-wrap gap-x-8 gap-y-2 text-gray-600">
        {ALL_AMENITIES.map((amenity, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`amenities${index + 1}`}
              checked={inputs.amenities[amenity]}
              onChange={() => toggleAmenity(amenity)}
            />
            <label htmlFor={`amenities${index + 1}`}>{amenity}</label>
          </div>
        ))}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-8 rounded bg-primary px-8 py-2 text-white transition hover:bg-primary/90 disabled:opacity-60"
      >
        {loading ? "Adding..." : "Add Room"}
      </button>
    </form>
  );
};

export default AddRoom;

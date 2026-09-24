import { useEffect, useState } from "react";

const HotelImagePicker = ({ existingImages = [], onChange, max = 8 }) => {
  const [items, setItems] = useState(() => existingImages.map(url => ({ type: "existing", value: url, key: `existing-${url}` })));

  useEffect(() => {
    setItems(existingImages.map(url => ({ type: "existing", value: url, key: `existing-${url}` })));
  }, [existingImages]);

  useEffect(() => {
    const newItems = items.filter(item => item.type === "new");
    const keptImages = items.filter(item => item.type === "existing").map(item => item.value);
    onChange({ keptImages, newFiles: newItems.map(item => item.value) });
  }, [items, onChange]);

  const addFiles = files => {
    const selected = Array.from(files || []).filter(file => file.type.startsWith("image/"));
    const room = Math.max(0, max - items.length);
    const additions = selected.slice(0, room).map((file, index) => ({
      type: "new", value: file, preview: URL.createObjectURL(file), key: `new-${Date.now()}-${index}-${file.name}`
    }));
    if (additions.length) setItems(prev => [...prev, ...additions]);
  };

  const remove = key => setItems(prev => prev.filter(item => item.key !== key));

  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(item => (
          <div key={item.key} className="group relative aspect-[4/3] overflow-hidden rounded-xl border bg-gray-50">
            <img src={item.type === "new" ? item.preview : item.value} alt="Hotel" className="h-full w-full object-cover" />
            <button type="button" onClick={() => remove(item.key)} className="absolute right-2 top-2 rounded-full bg-black/70 px-2 py-1 text-xs font-semibold text-white opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">Remove</button>
          </div>
        ))}
        {items.length < max && (
          <label className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 text-center text-sm text-gray-500 transition hover:border-primary hover:text-primary">
            <span className="text-2xl">+</span>
            <span>Add photos</span>
            <input type="file" accept="image/*" multiple hidden onChange={e => { addFiles(e.target.files); e.target.value = ""; }} />
          </label>
        )}
      </div>
      <p className="mt-2 text-xs text-gray-500">Up to {max} images, 5MB each. JPG, PNG and other image formats are supported.</p>
    </div>
  );
};

export default HotelImagePicker;

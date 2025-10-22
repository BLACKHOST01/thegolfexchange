"use client";

import { useState, ChangeEvent, FormEvent } from "react";

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  buttonLabel?: string; // ✅ optional button label (Add / Update / Save)
}

export default function ProductForm({
  initialData,
  onSubmit,
  buttonLabel = "Save Product", // ✅ default label
}: ProductFormProps) {
  const [form, setForm] = useState({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price || "",
    stock: initialData?.stock || 0,
    categoryId: initialData?.categoryId || "",
    subcategoryId: initialData?.subcategoryId || "",
    condition: initialData?.condition || "NEW",
    location: initialData?.location || "",
    isFeatured: initialData?.isFeatured || false,
    isUsed: initialData?.isUsed || false,
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(
    initialData?.images || []
  );

  // Handle text/number/select/checkbox changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      setForm({ ...form, [name]: e.target.checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Handle image file selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);

    // Generate preview URLs
    const previews = files.map((file) => URL.createObjectURL(file));
    setPreviews(previews);
  };

  // Submit handler
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Upload images
    let imagePaths: string[] = [];

    if (images.length > 0) {
      const formData = new FormData();
      images.forEach((file) => formData.append("files", file));

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();
      imagePaths = uploadData.paths || [];
    } else if (initialData?.images) {
      imagePaths = initialData.images;
    }

    onSubmit({ ...form, images: imagePaths });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic fields */}
      <input
        name="title"
        value={form.title}
        onChange={handleChange}
        placeholder="Title"
        className="w-full p-2 border rounded"
      />
      <textarea
        name="description"
        value={form.description}
        onChange={handleChange}
        placeholder="Description"
        className="w-full p-2 border rounded"
      />
      <input
        name="price"
        type="number"
        value={form.price}
        onChange={handleChange}
        placeholder="Price"
        className="w-full p-2 border rounded"
      />
      <input
        name="stock"
        type="number"
        value={form.stock}
        onChange={handleChange}
        placeholder="Stock"
        className="w-full p-2 border rounded"
      />
      <input
        name="location"
        value={form.location}
        onChange={handleChange}
        placeholder="Location"
        className="w-full p-2 border rounded"
      />

      <select
        name="condition"
        value={form.condition}
        onChange={handleChange}
        className="w-full p-2 border rounded"
      >
        <option value="NEW">New</option>
        <option value="USED">Used</option>
      </select>

      {/* Image uploader */}
      <div>
        <label className="block font-medium mb-1">Upload Images</label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageChange}
          className="block w-full text-sm text-gray-700 border rounded p-2"
        />

        {/* Preview section */}
        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            {previews.map((src, i) => (
              <img
                key={i}
                src={src}
                alt={`preview-${i}`}
                className="w-full h-32 object-cover rounded-md border"
              />
            ))}
          </div>
        )}
      </div>

      {/* Toggles */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isFeatured"
          checked={form.isFeatured}
          onChange={handleChange}
        />
        Featured Product
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isUsed"
          checked={form.isUsed}
          onChange={handleChange}
        />
        Used Product
      </label>

      <button
        type="submit"
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        {buttonLabel}
      </button>
    </form>
  );
}

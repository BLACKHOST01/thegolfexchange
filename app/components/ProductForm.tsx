"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { CategorySelect } from "@/app/components/CategorySelect";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

interface ComboboxOption {
  label: string;
  value: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function Combobox({ options, value, onChange, placeholder }: ComboboxProps) {
  const [query, setQuery] = useState("");

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="relative">
      <input
        className="w-full border rounded-md px-3 py-2"
        placeholder={placeholder}
        value={query || value}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => {
          if (query && !filtered.length) onChange(query);
        }}
      />
      {filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full rounded-md mt-1 max-h-40 overflow-y-auto">
          {filtered.map((o) => (
            <li
              key={o.value}
              className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
              onMouseDown={() => {
                onChange(o.value);
                setQuery("");
              }}
            >
              {o.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

interface ProductFormProps {
  initialData?: any;
  onSubmit: (data: any) => void;
  buttonLabel?: string;
}

export default function ProductForm({
  initialData,
  onSubmit,
  buttonLabel = "Save Product",
}: ProductFormProps) {
  const { user } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

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
    rating: initialData?.rating || 4.5,
  });

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(initialData?.images || []);
  const [categorySuggestions, setCategorySuggestions] = useState<string[]>([]);
  const [subcategorySuggestions, setSubcategorySuggestions] = useState<string[]>([]);

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const [cats, subs] = await Promise.all([
          fetch("/api/categories").then((r) => r.json()),
          fetch("/api/subcategories").then((r) => r.json()),
        ]);
        setCategorySuggestions(cats.map((c: any) => c.name));
        setSubcategorySuggestions(subs.map((s: any) => s.name));
      } catch (err) {
        console.error("Error fetching categories/subcategories:", err);
      }
    }
    fetchSuggestions();
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (e.target instanceof HTMLInputElement && e.target.type === "checkbox") {
      setForm({ ...form, [name]: e.target.checked });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setImages(files);
    setPreviews(files.map((file) => URL.createObjectURL(file)));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!mounted) return;

    if (!user?.token) {
      console.error("❌ No valid authentication token found");
      alert("Please log in again.");
      return router.push("/login");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("price", form.price.toString());
      formData.append("stock", form.stock.toString());
      formData.append("condition", form.condition);
      formData.append("categoryId", form.categoryId);
      formData.append("subcategoryId", form.subcategoryId);
      images.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create product");
      }

      const data = await res.json();
      console.log("✅ Product created successfully:", data);
      await onSubmit(data.product);

      // Optional redirect
      router.push("/admin/products");
    } catch (err: any) {
      console.error("❌ Error saving product:", err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <Card className="max-w-2xl mx-auto mt-10 border border-gray-200 shadow-lg rounded-2xl">
      <CardContent className="p-8 space-y-8">
        <h2 className="text-2xl font-semibold text-gray-800 text-center">
          Add / Edit Product
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                name="title"
                value={form.title}
                onChange={handleChange}
                placeholder="Product title"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Price (₦)</Label>
              <Input
                name="price"
                type="number"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Product description..."
              rows={3}
              required
            />
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Combobox
                options={categorySuggestions.map((c) => ({ label: c, value: c }))}
                value={form.categoryId}
                onChange={(val) => setForm({ ...form, categoryId: val })}
                placeholder="Select or type category"
              />
            </div>
            <div className="space-y-2">
              <Label>Subcategory</Label>
              <Combobox
                options={subcategorySuggestions.map((s) => ({ label: s, value: s }))}
                value={form.subcategoryId}
                onChange={(val) => setForm({ ...form, subcategoryId: val })}
                placeholder="Select or type subcategory"
              />
            </div>
          </div>

          {/* Stock & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Stock</Label>
              <Input name="stock" type="number" value={form.stock} onChange={handleChange} />
            </div>
            <div className="space-y-2">
              <Label>Condition</Label>
              <CategorySelect
                label="Condition"
                options={["NEW", "USED"]}
                value={form.condition}
                onChange={(val) => setForm({ ...form, condition: val })}
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <Label>Upload Images</Label>
            <Input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageChange}
              className="mt-1"
            />
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-3">
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

          {/* Switches */}
          <div className="flex items-center justify-between">
            <Label className="flex items-center gap-2">
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(val) => setForm({ ...form, isFeatured: val })}
              />
              Featured
            </Label>
            <Label className="flex items-center gap-2">
              <Switch
                checked={form.isUsed}
                onCheckedChange={(val) => setForm({ ...form, isUsed: val })}
              />
              Used
            </Label>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {loading ? "Saving..." : buttonLabel}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

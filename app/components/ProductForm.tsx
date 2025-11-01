"use client";

import { useState, useEffect, useRef, ChangeEvent, FormEvent } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  ProductFormData,
  ComboboxOption,
  ComboboxProps,
  ProductFormProps,
} from "@/types/product";

// Enhanced Combobox Component
function Combobox({
  options,
  value,
  onChange,
  placeholder,
  disabled,
}: ComboboxProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const comboboxRef = useRef<HTMLDivElement>(null);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(query.toLowerCase())
  );

  const selectedOption = options.find((o) => o.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        comboboxRef.current &&
        !comboboxRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    setQuery("");
    setIsOpen(false);
  };

  return (
    <div ref={comboboxRef} className="relative">
      <input
        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder={placeholder}
        value={query || selectedOption?.label || ""}
        onChange={(e) => {
          setQuery(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        disabled={disabled}
      />
      {isOpen && filtered.length > 0 && (
        <ul className="absolute z-10 bg-white border w-full rounded-md mt-1 max-h-40 overflow-y-auto shadow-lg">
          {filtered.map((option) => (
            <li
              key={option.value}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
      {isOpen && filtered.length === 0 && query && (
        <div className="absolute z-10 bg-white border w-full rounded-md mt-1 p-3 text-gray-500">
          No options found
        </div>
      )}
    </div>
  );
}

// Product Form Validation Schema with proper typing
const productSchema = {
  title: (value: string) => {
    if (!value.trim()) return "Title is required";
    if (value.length < 3) return "Title must be at least 3 characters";
    if (value.length > 100) return "Title must be less than 100 characters";
    return null;
  },
  description: (value: string) => {
    if (!value.trim()) return "Description is required";
    if (value.length < 10) return "Description must be at least 10 characters";
    if (value.length > 1000)
      return "Description must be less than 1000 characters";
    return null;
  },
  price: (value: number) => {
    if (value <= 0) return "Price must be greater than 0";
    if (value > 1000000) return "Price must be less than 1,000,000";
    return null;
  },
  stock: (value: number) => {
    if (value < 0) return "Stock cannot be negative";
    if (!Number.isInteger(value)) return "Stock must be a whole number";
    return null;
  },
  categoryId: (value: string) => {
    if (!value) return "Category is required";
    return null;
  },
};

// Define a union type for schema field names
type SchemaField = keyof typeof productSchema;

export default function ProductForm({
  initialData,
  onSubmit,
  buttonLabel = "Save Product",
  isEditing = false,
  externalSubmit = false,
}: ProductFormProps & { externalSubmit?: boolean }) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);

  // FIXED: Use the correct ProductFormData type with all required fields
  const [form, setForm] = useState<ProductFormData>({
    title: initialData?.title || "",
    description: initialData?.description || "",
    price: initialData?.price || 0,
    stock: initialData?.stock || 0,
    categoryId: initialData?.categoryId || "",
    subcategoryId: initialData?.subcategoryId || "",
    condition: initialData?.condition || "NEW",
    isFeatured: initialData?.isFeatured || false,
    isUsed: initialData?.isUsed || false,
    location: initialData?.location || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(
    (initialData as any)?.images || []
  );
  const [categories, setCategories] = useState<ComboboxOption[]>([]);
  const [subcategories, setSubcategories] = useState<ComboboxOption[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    ComboboxOption[]
  >([]);

  // Mount effect and data fetching
  useEffect(() => {
    setMounted(true);

    async function fetchSuggestions() {
      setCategoriesLoading(true);
      try {
        const [catRes] = await Promise.all([
          fetch("/api/categories").then((r) => {
            if (!r.ok) throw new Error("Failed to fetch categories");
            return r.json();
          }),
        ]);

        // FIXED: Handle the response structure from your categories API
        if (catRes.success) {
          setCategories(
            catRes.data.map((c: any) => ({ 
              label: `${c.name} (${c._count?.products || 0})`, 
              value: c.id 
            }))
          );
        } else {
          console.error("Failed to load categories:", catRes.error);
        }

        setSubcategories([]);
      } catch (err) {
        console.error("Error fetching categories/subcategories:", err);
      } finally {
        setCategoriesLoading(false);
      }
    }
    fetchSuggestions();
  }, []);

  // FIXED: Load subcategories when category changes
  useEffect(() => {
    const loadSubcategories = async () => {
      if (!form.categoryId) {
        setFilteredSubcategories([]);
        return;
      }

      try {
        const res = await fetch(`/api/categories/${form.categoryId}/subcategories`);
        if (!res.ok) throw new Error("Failed to fetch subcategories");
        
        const data = await res.json();
        if (data.success) {
          const subcatOptions = data.data.subcategories.map((s: any) => ({
            label: `${s.name} (${s._count?.products || 0})`,
            value: s.id
          }));
          setFilteredSubcategories(subcatOptions);
        } else {
          setFilteredSubcategories([]);
        }
      } catch (error) {
        console.error("Error loading subcategories:", error);
        setFilteredSubcategories([]);
      }
    };

    loadSubcategories();
  }, [form.categoryId]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      previews.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previews]);

  // Fixed validateField function with proper typing
  const validateField = (name: SchemaField, value: unknown): string | null => {
    const validator = productSchema[name] as
      | ((val: string) => string | null)
      | ((val: number) => string | null);

    switch (name) {
      case "title":
      case "description":
      case "categoryId":
        return (validator as (val: string) => string | null)(value as string);
      case "price":
      case "stock":
        return (validator as (val: number) => string | null)(value as number);
      default:
        return null;
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    (Object.keys(productSchema) as SchemaField[]).forEach((key) => {
      const error = validateField(key, form[key]);
      if (error) {
        newErrors[key] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectChange = (e: ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;

    let processedValue: any = value;
    if (type === "number") {
      processedValue = value === "" ? 0 : Number(value);
    } else if (type === "checkbox") {
      processedValue = checked;
    }

    setForm((prev) => ({ ...prev, [name]: processedValue }));

    // Validate field in real-time only if it's in the schema
    if (name in productSchema) {
      const error = validateField(name as SchemaField, processedValue);
      setErrors((prev) => ({
        ...prev,
        [name]: error || "",
      }));
    }
  };

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);

    // Validate files
    const validFiles = files.filter((file) => {
      if (!file.type.startsWith("image/")) {
        alert(`❌ ${file.name} is not an image file`);
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`❌ ${file.name} is too large (max 5MB)`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    setImages((prev) => [...prev, ...validFiles]);

    // Create previews
    const newPreviews = validFiles.map((file) => URL.createObjectURL(file));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    // Revoke object URL to avoid memory leaks
    URL.revokeObjectURL(previews[index]);

    setPreviews((prev) => prev.filter((_, i) => i !== index));
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  // FIXED: Handle form submission - ensure externalSubmit works correctly
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!mounted || authLoading) return;

    // Validate form
    if (!validateForm()) {
      alert("❌ Please fix the errors in the form before submitting.");
      return;
    }

    // Create proper submission data
    const submissionData = {
      title: form.title,
      description: form.description,
      price: form.price,
      stock: form.stock,
      condition: form.condition,
      categoryId: form.categoryId,
      subcategoryId: form.subcategoryId,
      location: form.location,
      isFeatured: form.isFeatured,
      isUsed: form.isUsed,
      images: images,
    };

    console.log("🟡 ProductForm submission data:", submissionData);
    console.log("🟡 externalSubmit value:", externalSubmit);
    console.log("🟡 onSubmit function available:", !!onSubmit);

    // FIXED: Always pass data to parent when externalSubmit is true, regardless of loading state
    if (externalSubmit && onSubmit) {
      console.log("🟡 Using EXTERNAL submission to parent component");
      setLoading(true);
      try {
        await onSubmit(submissionData);
      } catch (error) {
        console.error("Error in form submission:", error);
        // Don't set loading to false here - let parent handle loading state
        return; // Return early on error
      }
      // Don't set loading to false here - let parent handle loading state
      return;
    }

    console.log("🟡 Using INTERNAL submission");

    // Otherwise, handle submission internally
    const token = user?.token || localStorage.getItem("token");
    if (!token) {
      alert("❌ Please log in to continue.");
      return router.push("/login");
    }

    setLoading(true);
    try {
      console.log("Internal form submission:", submissionData);
      // Your internal submission logic here
    } catch (err: any) {
      console.error(
        `❌ Error ${isEditing ? "updating" : "creating"} product:`,
        err
      );
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto mt-10 border border-gray-200 shadow-lg rounded-2xl">
      <CardContent className="p-8 space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-semibold text-gray-800">
            {isEditing ? "Edit Product" : "Add New Product"}
          </h2>
          <p className="text-gray-600 mt-2">
            {isEditing
              ? "Update your product details"
              : "Fill in the details to add a new product"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className={errors.title ? "border-red-500" : ""}
                placeholder="Enter product title"
              />
              {errors.title && (
                <p className="text-red-500 text-sm mt-1">{errors.title}</p>
              )}
            </div>
            <div>
              <Label htmlFor="price">Price ($) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={handleChange}
                required
                className={errors.price ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              required
              rows={4}
              className={errors.description ? "border-red-500" : ""}
              placeholder="Describe your product in detail..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description}</p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              {form.description.length}/1000 characters
            </p>
          </div>

          {/* Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category *</Label>
              <Combobox
                options={categories}
                value={form.categoryId}
                onChange={(val) =>
                  setForm((prev) => ({ 
                    ...prev, 
                    categoryId: val,
                    subcategoryId: "" // Reset subcategory when category changes
                  }))
                }
                placeholder={
                  categoriesLoading
                    ? "Loading categories..."
                    : "Select category"
                }
                disabled={categoriesLoading}
              />
              {errors.categoryId && (
                <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>
              )}
            </div>
            <div>
              <Label htmlFor="subcategory">Subcategory</Label>
              <Combobox
                options={filteredSubcategories}
                value={form.subcategoryId}
                onChange={(val) =>
                  setForm((prev) => ({ ...prev, subcategoryId: val }))
                }
                placeholder={
                  form.categoryId
                    ? filteredSubcategories.length > 0 
                      ? "Select subcategory" 
                      : "No subcategories available"
                    : "Select category first"
                }
                disabled={!form.categoryId || categoriesLoading || filteredSubcategories.length === 0}
              />
            </div>
          </div>

          {/* Stock & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stock">Stock Quantity *</Label>
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                value={form.stock}
                onChange={handleChange}
                required
                className={errors.stock ? "border-red-500" : ""}
                placeholder="0"
              />
              {errors.stock && (
                <p className="text-red-500 text-sm mt-1">{errors.stock}</p>
              )}
            </div>
            <div>
              <Label htmlFor="condition">Condition *</Label>
              <select
                id="condition"
                name="condition"
                value={form.condition}
                onChange={handleSelectChange}
                className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="NEW">New</option>
                <option value="USED">Used</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              name="location"
              value={form.location}
              onChange={handleChange}
              placeholder="Enter product location (e.g., Lagos, Nigeria)"
            />
            <p className="text-gray-500 text-sm mt-1">
              Optional: Where the product is located
            </p>
          </div>

          {/* Images */}
          <div>
            <Label htmlFor="images">Product Images</Label>
            <Input
              id="images"
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="mb-3"
            />
            <p className="text-gray-500 text-sm mb-3">
              Upload product images (Max 5MB per image)
            </p>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-3">
                {previews.map((src, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={src}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-md border"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Switches */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <Label className="flex items-center gap-3 cursor-pointer">
              <Switch
                checked={form.isFeatured}
                onCheckedChange={(val) =>
                  setForm((prev) => ({ ...prev, isFeatured: val }))
                }
              />
              <div>
                <div className="font-medium">Featured Product</div>
                <div className="text-sm text-gray-500">
                  Show this product in featured section
                </div>
              </div>
            </Label>

            <Label className="flex items-center gap-3 cursor-pointer">
              <Switch
                checked={form.isUsed}
                onCheckedChange={(val) =>
                  setForm((prev) => ({ ...prev, isUsed: val }))
                }
              />
              <div>
                <div className="font-medium">Mark as Used</div>
                <div className="text-sm text-gray-500">
                  This product is pre-owned
                </div>
              </div>
            </Label>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={loading || categoriesLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {isEditing ? "Updating..." : "Creating..."}
              </span>
            ) : (
              buttonLabel
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
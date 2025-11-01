"use client";
import ProductForm from "@/app/components/ProductForm";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductFormData } from "@/types/product";

// Extended type to include images for the form
interface ProductFormDataWithImages extends ProductFormData {
  images?: string[];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<ProductFormDataWithImages | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!params.id) {
          throw new Error("Product ID is missing");
        }

        const res = await fetch(`/api/products/${params.id}`);

        if (!res.ok) {
          if (res.status === 404) {
            throw new Error("Product not found");
          }
          throw new Error(`Failed to fetch product: ${res.status}`);
        }

        const data = await res.json();

        // Transform API data to match ProductFormData interface
        const transformedData: ProductFormDataWithImages = {
          id: data.id,
          title: data.title,
          description: data.description || "",
          price: data.price,
          stock: data.stock || 0,
          categoryId: data.categoryId || "",
          subcategoryId: data.subcategoryId || "",
          condition: data.condition || "NEW",
          isFeatured: data.isFeatured || false,
          isUsed: data.isUsed || false,
          location: data.location || "",
          // Handle both possible image field names from API
          images: data.images || data.image || [],
        };

        setProduct(transformedData);
      } catch (error) {
        console.error("Error fetching product:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Failed to load product";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [params.id]);
  const handleUpdate = async (
    formData: ProductFormData & { images: File[] }
  ) => {
    try {
      setError(null);

      if (!params.id) {
        throw new Error("Product ID is missing");
      }

      // Handle image uploads first if there are new images
      const uploadedImageUrls: string[] = [];

      if (formData.images && formData.images.length > 0) {
        for (const image of formData.images) {
          if (image instanceof File) {
            const imageUrl = await uploadImage(image);
            uploadedImageUrls.push(imageUrl);
          } else {
            // Keep existing image URLs
            uploadedImageUrls.push(image);
          }
        }
      }

      // Prepare data for JSON API
      const updateData = {
        ...formData,
        price: Number(formData.price),
        stock: Number(formData.stock),
        categoryId: formData.categoryId || null,
        subcategoryId: formData.subcategoryId || null,
        images: uploadedImageUrls, // Use the processed image URLs
      };

      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(
          responseData.error ||
            responseData.message ||
            "Failed to update product"
        );
      }

      alert("✅ Product updated successfully!");
      router.push("/admin/products");
      router.refresh();
    } catch (error: any) {
      console.error("Error updating product:", error);
      setError(error.message);
      alert(error.message);
    }
  };

  // Helper function for image upload
  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      throw new Error("Failed to upload image");
    }

    const data = await res.json();
    return data.url;
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <div className="text-lg text-gray-600">Loading product...</div>
        </div>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="container mx-auto py-8">
        <div className="p-6 text-center">
          <div className="text-red-500 text-xl mb-4">❌ {error}</div>
          <button
            onClick={() => router.push("/admin/products")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="text-lg text-red-500 mb-4">Product not found</div>
          <button
            onClick={() => router.push("/admin/products")}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Edit Product</h1>
            <p className="text-gray-600">Update the product details below</p>
          </div>
          <button
            onClick={handleCancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="text-red-700">{error}</div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-gray-200">
          <ProductForm
            initialData={product}
            onSubmit={handleUpdate}
            buttonLabel="Update Product"
            isEditing={true}
          />
        </div>
      </div>
    </div>
  );
}

"use client";
import ProductForm from "@/app/components/ProductForm";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ProductFormData } from "@/types/product";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<ProductFormData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data = await res.json();
        setProduct(data);
      } catch (error) {
        console.error("Error fetching product:", error);
        alert("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  const handleUpdate = async (data: any) => {
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          price: Number(data.price),
          // Remove the image property and use images instead
          // The ProductForm already handles images properly
        }),
      });

      if (res.ok) {
        alert("✅ Product updated successfully!");
        router.push("/admin/products");
      } else {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update product");
      }
    } catch (error: any) {
      console.error("Error updating product:", error);
      alert(error.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-lg text-red-500">Product not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Edit Product</h1>
        <p className="text-gray-600 mb-6">
          Update the product details below
        </p>
        <ProductForm
          initialData={{
            // Use the correct property names from ProductFormData
            id: product.id,
            title: product.title,
            description: product.description || "",
            price: product.price,
            stock: product.stock || 0,
            categoryId: product.categoryId || "",
            subcategoryId: product.subcategoryId || "",
            condition: product.condition || "NEW",
            isFeatured: product.isFeatured || false,
            isUsed: product.isUsed || false,
            images: product.images || [], // Use 'images' not 'image'
          }}
          onSubmit={handleUpdate}
          buttonLabel="Update Product"
          isEditing={true}
        />
      </div>
    </div>
  );
}
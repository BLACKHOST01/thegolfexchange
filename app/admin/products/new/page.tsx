"use client";
import { useState } from "react";
import ProductForm from "@/app/components/ProductForm";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function AddProductPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleAdd = async (formData: any) => {
    if (!user) {
      alert("❌ Please log in to add a product.");
      return router.push("/login");
    }

    setLoading(true);
    try {
      const formDataToSend = new FormData();
      
      // Append form data
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          formDataToSend.append(key, value.toString());
        }
      });

      // Append images if any
      if (formData.images && formData.images.length > 0) {
        formData.images.forEach((file: File) => {
          formDataToSend.append("files", file);
        });
      }

      const res = await fetch("/api/products", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        body: formDataToSend,
      });

      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to create product");
      }

      alert("✅ Product created successfully!");
      router.push("/admin/products");
      
    } catch (error: any) {
      console.error("❌ Error creating product:", error);
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="p-6">
        <h1 className="text-3xl font-bold mb-2">Add New Product</h1>
        <p className="text-gray-600 mb-6">
          Fill in the details below to add a new product to your store
        </p>
        <ProductForm 
          onSubmit={handleAdd} 
          buttonLabel={loading ? "Creating Product..." : "Add Product"}
          // You might want to pass loading state to disable the form
        />
      </div>
    </div>
  );
}
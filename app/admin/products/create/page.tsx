"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProductForm from "@/app/components/ProductForm";

export default function CreateProductPage() {
  const router = useRouter();

  const handleSubmit = async (formData: any) => {
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create product");
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>
      <ProductForm onSubmit={handleSubmit} />
    </div>
  );
}

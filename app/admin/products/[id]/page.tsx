"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import ProductForm from "@/app/components/ProductForm";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    if (params?.id) {
      fetch(`/api/products/${params.id}`)
        .then((res) => res.json())
        .then((data) => setProduct(data));
    }
  }, [params?.id]);

  const handleSubmit = async (formData: any) => {
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update product");
      router.push("/admin/products");
    } catch (error) {
      console.error(error);
    }
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>
      <ProductForm initialData={product} onSubmit={handleSubmit} />
    </div>
  );
}

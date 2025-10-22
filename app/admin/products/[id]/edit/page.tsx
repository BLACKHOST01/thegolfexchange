"use client";
import ProductForm from "@/app/components/ProductForm";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState<any>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      const res = await fetch(`/api/products/${params.id}`);
      const data = await res.json();
      setProduct(data);
    };
    fetchProduct();
  }, [params.id]);

  const handleUpdate = async (data: any) => {
    const res = await fetch(`/api/products/${params.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        price: Number(data.price),
        images: data.image ? [data.image] : [],
      }),
    });

    if (res.ok) {
      alert("✅ Product updated");
      router.push("/admin/products");
    } else {
      alert("Failed to update");
    }
  };

  if (!product) return <p>Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <ProductForm
        initialData={{
          title: product.title,
          price: product.price.toString(),
          image: product.images?.[0] || "",
          condition: product.condition,
        }}
        onSubmit={handleUpdate}
        buttonLabel="Update Product"
      />
    </div>
  );
}

"use client";
import ProductForm from "@/app/components/ProductForm";
import { useRouter } from "next/navigation";

export default function AddProductPage() {
  const router = useRouter();

  const handleAdd = async (data: any) => {
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...data,
        price: Number(data.price),
        images: data.image ? [data.image] : [],
        sellerId: "admin",
        stock: 10,
      }),
    });

    if (res.ok) {
      alert("✅ Product created");
      router.push("/admin/products");
    } else {
      alert("❌ Failed to add product");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Add Product</h1>
      <ProductForm onSubmit={handleAdd} buttonLabel="Add Product" />
    </div>
  );
}

"use client";
import { useRouter, useParams } from "next/navigation";

export default function DeleteProductPage() {
  const router = useRouter();
  const params = useParams();

  const handleDelete = async () => {
    const res = await fetch(`/api/products/${params.id}`, { method: "DELETE" });
    if (res.ok) {
      alert("🗑️ Product deleted");
      router.push("/admin/products");
    } else {
      alert("Failed to delete");
    }
  };

  return (
    <div className="p-6 text-center">
      <h1 className="text-2xl font-bold mb-4">Delete Product</h1>
      <p>Are you sure you want to delete this product?</p>
      <div className="flex justify-center gap-4 mt-6">
        <button
          onClick={handleDelete}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          Delete
        </button>
        <button
          onClick={() => router.push("/admin/products")}
          className="bg-gray-300 px-4 py-2 rounded"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

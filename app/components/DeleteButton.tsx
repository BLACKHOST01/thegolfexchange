"use client";

import { useRouter } from "next/navigation";

export default function DeleteButton({ id }: { id: string }) {
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={handleDelete} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">
      Delete
    </button>
  );
}

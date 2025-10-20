"use client";
import React, { useEffect, useState } from "react";
import { ShopCard } from "../components/ui/ShopCard";

export default function ShopPage() {
  const [products, setProducts] = useState([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then(setProducts)
      .catch(console.error);
  }, []);

  return (
    <section className="py-22 px-4 grid sm:grid-cols-2 md:grid-cols-3 gap-8">
      {products.map((p: any) => (
        <ShopCard
          key={p.id}
          id={p.id}
          title={p.title}
          description={p.description}
          price={p.price}
          image={p.images?.[0] ?? "/placeholder.png"}
          condition={p.condition}
        />
      ))}
    </section>
  );
}

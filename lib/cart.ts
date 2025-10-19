// /lib/cart.ts
export async function fetchCart(userId: string) {
  const res = await fetch(`/api/cart`, {
    headers: { "x-user-id": userId },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("🧩 Fetch cart error:", err);
    throw new Error(err.error || "Failed to fetch cart");
  }

  return res.json();
}

export async function addToCart(userId: string, productId: string, quantity = 1) {
  const res = await fetch(`/api/cart`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify({ productId, quantity }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("🧩 Add to cart error:", err);
    throw new Error(err.error || "Failed to add item");
  }

  return res.json();
}

export async function updateCartItem(userId: string, itemId: string, quantity: number) {
  const res = await fetch(`/api/cart`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "x-user-id": userId,
    },
    body: JSON.stringify({ cartItemId: itemId, quantity }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("🧩 Update item error:", err);
    throw new Error(err.error || "Failed to update item");
  }

  return res.json();
}

export async function removeCartItem(userId: string, itemId: string) {
  const res = await fetch(`/api/cart?id=${itemId}`, {
    method: "DELETE",
    headers: { "x-user-id": userId },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("🧩 Remove item error:", err);
    throw new Error(err.error || "Failed to remove item");
  }

  return res.json();
}

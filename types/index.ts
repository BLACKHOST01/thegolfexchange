export type Product = {
  id: string;
  title: string;
  price: number;
  images?: string[];
};

export type CartItem = {
  id: string;
  quantity: number;
  product: Product;
};

export type Cart = {
  id: string;
  items: CartItem[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
};
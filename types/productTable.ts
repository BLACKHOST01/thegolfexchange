export interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  images?: string[];
}

export interface ProductTableProps {
  products: Product[];
  onDelete: (id: string) => void;
  itemsPerPage?: number;
}

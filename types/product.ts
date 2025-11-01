// types/product.ts

export interface ProductFormData {
  id?: string;
  title: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  subcategoryId: string;
  condition: "NEW" | "USED";
  isFeatured: boolean;
  isUsed: boolean;
  location?: string;
}

export interface ComboboxOption {
  label: string;
  value: string;
}

export interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

// Improved ProductFormProps interface
export interface ProductFormProps {
  initialData?: Partial<ProductFormData> & { 
    images?: string[] | File[]; // Support both URLs and File objects
  };
  onSubmit?: (data: ProductFormData & { images: File[] }) => void;
  buttonLabel?: string;
  isEditing?: boolean;
  externalSubmit?: boolean;
  onCancel?: () => void; // Add cancel handler
}

// Additional type for API responses
export interface ProductApiResponse extends ProductFormData {
  id: string;
  createdAt?: string;
  updatedAt?: string;
  // Support different image field names from API
  images?: string[];
  image?: string[]; // Some APIs might use singular 'image'
}
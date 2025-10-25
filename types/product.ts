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
  images?: string[];
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

export interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit?: (data: ProductFormData & { images: File[] }) => void;
  buttonLabel?: string;
  isEditing?: boolean;
  externalSubmit?: boolean; // Add this
  loading?: boolean; // Add this
}


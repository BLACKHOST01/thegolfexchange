import { z } from 'zod';

export const OrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive(),
  price: z.number().positive(),
});

export const ShippingAddressSchema = z.object({
  street: z.string().min(1, "Street is required"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(1, "Postal code is required"),
  country: z.string().min(1, "Country is required"),
});

export const CreateOrderSchema = z.object({
  items: z.array(OrderItemSchema).min(1, "At least one item is required"),
  totalAmount: z.number().positive("Valid total amount is required"),
  shippingAddress: ShippingAddressSchema,
  notes: z.string().optional(),
});

export const GetOrdersQuerySchema = z.object({
  search: z.string().optional().default(""),
  status: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type GetOrdersQueryInput = z.infer<typeof GetOrdersQuerySchema>;
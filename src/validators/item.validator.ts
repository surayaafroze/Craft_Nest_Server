import { z } from 'zod';

export const createItemSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long' }),
  shortDescription: z.string().min(10, { message: 'Short description must be at least 10 characters long' }),
  fullDescription: z.string().min(10, { message: 'Description must be at least 10 characters long' }),
  category: z.string().min(2, { message: 'Category is required' }),
  price: z.number().nonnegative({ message: 'Price must be a positive number' }),
  images: z.array(z.string().url({ message: 'Invalid image URL format' })).min(1, { message: 'At least one image is required' }),
  quantity: z.number().int().nonnegative({ message: 'Quantity must be a non-negative integer' }),
  location: z.string().min(2, { message: 'Location is required' }),
});

export const updateItemSchema = createItemSchema.partial();

export const updateStatusSchema = z.object({
  status: z.enum(['approved', 'rejected', 'pending'], { message: 'Status is required and must be approved, rejected, or pending' }),
});

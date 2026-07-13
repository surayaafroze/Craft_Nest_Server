import { z } from 'zod';

export const updateUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
  avatarUrl: z.string().url('Avatar must be a valid URL').optional().or(z.literal('')),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional(),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['active', 'suspended', 'admin']),
});

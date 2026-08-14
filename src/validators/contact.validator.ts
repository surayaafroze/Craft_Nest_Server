import { z } from 'zod';

export const submitContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  subject: z.string().min(3, 'Subject must be at least 3 characters'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
});

export const createContactMessageSchema = submitContactSchema;

export const updateContactStatusSchema = z.object({
  status: z.enum(['new', 'read', 'responded'], { message: 'Status must be new, read, or responded' }),
});

export type SubmitContactInput = z.infer<typeof submitContactSchema>;
export type CreateContactInput = SubmitContactInput;
export type UpdateContactStatusInput = z.infer<typeof updateContactStatusSchema>;


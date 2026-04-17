import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export const registerApiSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  kdfSalt: z.string().min(1),
  encryptedMasterKey: z.string().min(1),
  masterKeyIv: z.string().min(1),
});

export const noteUpsertSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  content: z.string().max(1_000_000, 'Content too large').default(''),
  isEncrypted: z.boolean().default(false),
  iv: z.string().max(64).optional(),
  tags: z.array(z.string().min(1).max(50)).max(20).default([]),
});

export const notePatchSchema = noteUpsertSchema.partial();

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type NoteUpsertInput = z.infer<typeof noteUpsertSchema>;

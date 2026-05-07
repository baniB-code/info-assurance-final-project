import { z } from "zod";

const upper = /[A-Z]/;
const lower = /[a-z]/;
const number = /\d/;
const symbol = /[^A-Za-z0-9]/;

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(128, "Password is too long.")
  .refine((v) => upper.test(v), "Password needs an uppercase letter.")
  .refine((v) => lower.test(v), "Password needs a lowercase letter.")
  .refine((v) => number.test(v), "Password needs a number.")
  .refine((v) => symbol.test(v), "Password needs a symbol.");

export const signupSchema = z.object({
  email: z.string().email().max(255).transform((v) => v.trim().toLowerCase()),
  password: passwordSchema,
  displayName: z.string().min(2).max(64).transform((v) => v.trim()),
});

export const loginSchema = z.object({
  email: z.string().email().max(255).transform((v) => v.trim().toLowerCase()),
  password: z.string().min(1).max(128),
  rememberMe: z.boolean().optional().default(false),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255).transform((v) => v.trim().toLowerCase()),
});

export const noteSchema = z.object({
  title: z.string().min(1).max(120),
  content: z.string().min(1).max(4000),
  isPinned: z.boolean().default(false),
  isArchived: z.boolean().default(false),
});

export const profileSchema = z.object({
  displayName: z.string().min(2).max(64),
  bio: z.string().max(240).optional().default(""),
  avatarUrl: z.string().max(2048).optional().default(""),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});

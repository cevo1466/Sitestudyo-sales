import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Gecerli bir e-posta adresi girin').max(191).toLowerCase().trim(),
  password: z.string().min(1, 'Sifre zorunlu').max(200),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(20, 'Token gecersiz'),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse extends TokenPair {
  user: { id: string; email: string; name: string; role: string };
}

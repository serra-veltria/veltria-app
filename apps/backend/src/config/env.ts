import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  // Server
  PORT: z.string().default('3001'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  BACKEND_URL: z.string().default('http://localhost:3001'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  
  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/veltria'),
  
  // JWT
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('7d'),
  
  // Session (for OAuth flow)
  SESSION_SECRET: z.string().min(32).optional(),
  
  // OAuth - Google
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  
  // OAuth - Microsoft
  MICROSOFT_CLIENT_ID: z.string().optional(),
  MICROSOFT_CLIENT_SECRET: z.string().optional(),
  
  // OAuth - GitHub
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment variables');
}

// Derive SESSION_SECRET from JWT_SECRET if not provided
const data = parsed.data;
if (!data.SESSION_SECRET) {
  data.SESSION_SECRET = data.JWT_SECRET;
}

export const env = data as Required<typeof data>;

// Helper to check which OAuth providers are configured
export function getConfiguredOAuthProviders(): ('google' | 'microsoft' | 'github')[] {
  const providers: ('google' | 'microsoft' | 'github')[] = [];
  
  if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
    providers.push('google');
  }
  if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
    providers.push('microsoft');
  }
  if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
    providers.push('github');
  }
  
  return providers;
}

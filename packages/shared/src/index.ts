// OAuth provider types
export type OAuthProvider = 'google' | 'microsoft' | 'github';

// Auth types
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  emailVerified: boolean;
  linkedProviders: OAuthProvider[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: User;
  token: string;
  isNewUser?: boolean;
  wasLinked?: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
}

// OAuth types
export interface OAuthCallbackParams {
  code: string;
  state?: string;
}

export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  redirectUri: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Validation helpers
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function isValidPassword(password: string): boolean {
  return password.length >= 8;
}

// Constants
export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    SIGNUP: '/api/auth/signup',
    LOGOUT: '/api/auth/logout',
    ME: '/api/auth/me',
    OAUTH: {
      GOOGLE: '/api/auth/oauth/google',
      MICROSOFT: '/api/auth/oauth/microsoft',
      GITHUB: '/api/auth/oauth/github',
      CALLBACK: {
        GOOGLE: '/api/auth/oauth/google/callback',
        MICROSOFT: '/api/auth/oauth/microsoft/callback',
        GITHUB: '/api/auth/oauth/github/callback',
      },
    },
  },
} as const;

// OAuth button branding info
export const OAUTH_PROVIDERS: Record<OAuthProvider, { name: string; color: string; bgColor: string }> = {
  google: {
    name: 'Google',
    color: '#ffffff',
    bgColor: '#4285F4',
  },
  microsoft: {
    name: 'Microsoft',
    color: '#ffffff',
    bgColor: '#2F2F2F',
  },
  github: {
    name: 'GitHub',
    color: '#ffffff',
    bgColor: '#24292e',
  },
};

// Re-export hub types
export * from './hub-types.js';

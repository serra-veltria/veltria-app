import { Request, Response } from 'express';
import { z } from 'zod';
import { User, IUser } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import type { ApiResponse, AuthResponse, User as UserType, OAuthProvider } from '@veltria/shared';

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function formatUser(user: IUser): UserType {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    emailVerified: user.emailVerified,
    linkedProviders: user.oauthAccounts.map((account) => account.provider as OAuthProvider),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function signup(req: Request, res: Response): Promise<void> {
  try {
    const validation = signupSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse = {
        success: false,
        error: validation.error.errors[0].message,
      };
      res.status(400).json(response);
      return;
    }

    const { email, password, name } = validation.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // If user exists but only has OAuth accounts (no password), allow setting password
      if (!existingUser.password) {
        existingUser.password = password;
        await existingUser.save();
        
        const token = generateToken(existingUser._id.toString());
        const response: ApiResponse<AuthResponse> = {
          success: true,
          data: {
            user: formatUser(existingUser),
            token,
          },
          message: 'Password set successfully. You can now log in with email and password.',
        };
        res.status(200).json(response);
        return;
      }
      
      const response: ApiResponse = {
        success: false,
        error: 'Email already registered',
      };
      res.status(409).json(response);
      return;
    }

    // Create new user
    const user = await User.create({ email: email.toLowerCase(), password, name });
    const token = generateToken(user._id.toString());

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: formatUser(user),
        token,
        isNewUser: true,
      },
      message: 'Account created successfully',
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('Signup error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };
    res.status(500).json(response);
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const validation = loginSchema.safeParse(req.body);
    if (!validation.success) {
      const response: ApiResponse = {
        success: false,
        error: validation.error.errors[0].message,
      };
      res.status(400).json(response);
      return;
    }

    const { email, password } = validation.data;

    // Find user with password field
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password',
      };
      res.status(401).json(response);
      return;
    }

    // Check if user has a password (might be OAuth-only user)
    if (!user.password) {
      const providers = user.oauthAccounts.map((a) => a.provider).join(', ');
      const response: ApiResponse = {
        success: false,
        error: `This account uses social login (${providers}). Please sign in with your social account or set a password.`,
      };
      res.status(401).json(response);
      return;
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password',
      };
      res.status(401).json(response);
      return;
    }

    const token = generateToken(user._id.toString());

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: formatUser(user),
        token,
      },
      message: 'Login successful',
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };
    res.status(500).json(response);
  }
}

export async function getMe(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      const response: ApiResponse = {
        success: false,
        error: 'Not authenticated',
      };
      res.status(401).json(response);
      return;
    }

    const response: ApiResponse<UserType> = {
      success: true,
      data: formatUser(req.user),
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('Get me error:', error);
    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
    };
    res.status(500).json(response);
  }
}

export async function logout(_req: Request, res: Response): Promise<void> {
  // JWT is stateless, so logout is handled client-side by removing the token
  // This endpoint exists for API completeness and potential future use (token blacklist)
  const response: ApiResponse = {
    success: true,
    message: 'Logged out successfully',
  };
  res.status(200).json(response);
}

import { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import type { ApiResponse, AuthResponse, User as UserType } from '@veltria/shared';

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

function formatUser(user: { _id: any; email: string; name: string; createdAt: Date; updatedAt: Date }): UserType {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
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
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'Email already registered',
      };
      res.status(409).json(response);
      return;
    }

    // Create new user
    const user = await User.create({ email, password, name });
    const token = generateToken(user._id.toString());

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: formatUser(user),
        token,
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
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid email or password',
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

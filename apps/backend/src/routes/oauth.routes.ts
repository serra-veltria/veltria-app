import { Router, Request, Response, NextFunction } from 'express';
import type { IRouter } from 'express';
import passport from '../config/passport.js';
import { IUser, OAuthProvider } from '../models/user.model.js';
import { generateToken } from '../utils/jwt.js';
import { env, getConfiguredOAuthProviders } from '../config/env.js';
import type { ApiResponse } from '@veltria/shared';

const router: IRouter = Router();

// Get available OAuth providers
router.get('/providers', (_req: Request, res: Response) => {
  const providers = getConfiguredOAuthProviders();
  res.json({
    success: true,
    data: { providers },
  });
});

// Helper to create OAuth callback handler
function createCallbackHandler(provider: OAuthProvider) {
  return (req: Request, res: Response) => {
    const user = req.user as IUser;
    if (!user) {
      return res.redirect(`${env.FRONTEND_URL}/login?error=oauth_failed`);
    }

    // Generate JWT token
    const token = generateToken(user._id.toString());

    // Redirect to frontend with token
    // Frontend will store the token and redirect to dashboard
    const params = new URLSearchParams({
      token,
      provider,
    });

    res.redirect(`${env.FRONTEND_URL}/oauth/callback?${params.toString()}`);
  };
}

// Helper to handle OAuth errors
function handleOAuthError(err: Error, _req: Request, res: Response, _next: NextFunction) {
  console.error('OAuth error:', err);
  const errorMessage = encodeURIComponent(err.message || 'Authentication failed');
  res.redirect(`${env.FRONTEND_URL}/login?error=${errorMessage}`);
}

// ============ GOOGLE OAUTH ============
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  // Initiate Google OAuth
  router.get(
    '/google',
    passport.authenticate('google', {
      scope: ['profile', 'email'],
      session: false,
    })
  );

  // Google OAuth callback
  router.get(
    '/google/callback',
    (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate('google', {
        session: false,
        failureRedirect: `${env.FRONTEND_URL}/login?error=google_auth_failed`,
      })(req, res, next);
    },
    createCallbackHandler('google'),
    handleOAuthError
  );
}

// ============ MICROSOFT OAUTH ============
if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
  // Initiate Microsoft OAuth
  router.get(
    '/microsoft',
    passport.authenticate('microsoft', {
      scope: ['user.read'],
      session: false,
    })
  );

  // Microsoft OAuth callback
  router.get(
    '/microsoft/callback',
    (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate('microsoft', {
        session: false,
        failureRedirect: `${env.FRONTEND_URL}/login?error=microsoft_auth_failed`,
      })(req, res, next);
    },
    createCallbackHandler('microsoft'),
    handleOAuthError
  );
}

// ============ GITHUB OAUTH ============
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  // Initiate GitHub OAuth
  router.get(
    '/github',
    passport.authenticate('github', {
      scope: ['user:email'],
      session: false,
    })
  );

  // GitHub OAuth callback
  router.get(
    '/github/callback',
    (req: Request, res: Response, next: NextFunction) => {
      passport.authenticate('github', {
        session: false,
        failureRedirect: `${env.FRONTEND_URL}/login?error=github_auth_failed`,
      })(req, res, next);
    },
    createCallbackHandler('github'),
    handleOAuthError
  );
}

// Catch-all for unconfigured providers
router.get('/:provider', (req: Request, res: Response) => {
  const response: ApiResponse = {
    success: false,
    error: `OAuth provider '${req.params.provider}' is not configured`,
  };
  res.status(400).json(response);
});

export default router;

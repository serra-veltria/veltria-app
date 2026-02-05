import passport from 'passport';
import { Strategy as GoogleStrategy, Profile as GoogleProfile, VerifyCallback as GoogleVerifyCallback } from 'passport-google-oauth20';
import { Strategy as GitHubStrategy, Profile as GitHubProfile } from 'passport-github2';
import { Strategy as MicrosoftStrategy, Profile as MicrosoftProfile, VerifyCallback as MicrosoftVerifyCallback } from 'passport-microsoft';
import { findOrCreateOAuthUser, IUser, OAuthProvider } from '../models/user.model.js';
import { env } from './env.js';

// Serialize user for session (we use JWT, so minimal)
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as IUser)._id.toString());
});

passport.deserializeUser((id: string, done) => {
  // We don't use sessions with JWT, this is just for passport flow
  done(null, { id } as Express.User);
});

// Type for unified OAuth profile
interface UnifiedProfile {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// Helper to extract profile data from Google
function extractGoogleProfile(profile: GoogleProfile): UnifiedProfile {
  return {
    id: profile.id,
    email: profile.emails?.[0]?.value || '',
    name: profile.displayName || [profile.name?.givenName, profile.name?.familyName].filter(Boolean).join(' ') || 'User',
    avatar: profile.photos?.[0]?.value,
  };
}

// Helper to extract profile data from Microsoft
function extractMicrosoftProfile(profile: MicrosoftProfile): UnifiedProfile {
  return {
    id: profile.id,
    email: profile.emails?.[0]?.value || profile._json.mail || profile._json.userPrincipalName || '',
    name: profile.displayName || [profile._json.givenName, profile._json.surname].filter(Boolean).join(' ') || 'User',
    avatar: undefined, // Microsoft doesn't provide avatar URL directly in the basic profile
  };
}

// Helper to extract profile data from GitHub
function extractGitHubProfile(profile: GitHubProfile): UnifiedProfile {
  return {
    id: profile.id,
    email: profile.emails?.[0]?.value || '',
    name: profile.displayName || profile.username || 'User',
    avatar: profile.photos?.[0]?.value,
  };
}

// Configure Google Strategy
if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: env.GOOGLE_CLIENT_ID,
        clientSecret: env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${env.BACKEND_URL}/api/auth/oauth/google/callback`,
        scope: ['profile', 'email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GoogleProfile,
        done: GoogleVerifyCallback
      ) => {
        try {
          const profileData = extractGoogleProfile(profile);
          
          if (!profileData.email) {
            return done(new Error('No email provided by Google. Please ensure your Google account has a verified email.'));
          }

          const { user } = await findOrCreateOAuthUser('google', profileData, {
            accessToken,
            refreshToken,
          });

          done(null, user);
        } catch (error) {
          console.error('Google OAuth error:', error);
          done(error as Error);
        }
      }
    )
  );
  console.log('✅ Google OAuth strategy configured');
} else {
  console.log('⚠️ Google OAuth not configured (missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET)');
}

// Configure Microsoft Strategy
if (env.MICROSOFT_CLIENT_ID && env.MICROSOFT_CLIENT_SECRET) {
  passport.use(
    new MicrosoftStrategy(
      {
        clientID: env.MICROSOFT_CLIENT_ID,
        clientSecret: env.MICROSOFT_CLIENT_SECRET,
        callbackURL: `${env.BACKEND_URL}/api/auth/oauth/microsoft/callback`,
        scope: ['user.read'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: MicrosoftProfile,
        done: MicrosoftVerifyCallback
      ) => {
        try {
          const profileData = extractMicrosoftProfile(profile);
          
          if (!profileData.email) {
            return done(new Error('No email provided by Microsoft. Please ensure your Microsoft account has a verified email.'));
          }

          const { user } = await findOrCreateOAuthUser('microsoft', profileData, {
            accessToken,
            refreshToken,
          });

          done(null, user);
        } catch (error) {
          console.error('Microsoft OAuth error:', error);
          done(error as Error);
        }
      }
    )
  );
  console.log('✅ Microsoft OAuth strategy configured');
} else {
  console.log('⚠️ Microsoft OAuth not configured (missing MICROSOFT_CLIENT_ID or MICROSOFT_CLIENT_SECRET)');
}

// Configure GitHub Strategy
if (env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET) {
  passport.use(
    new GitHubStrategy(
      {
        clientID: env.GITHUB_CLIENT_ID,
        clientSecret: env.GITHUB_CLIENT_SECRET,
        callbackURL: `${env.BACKEND_URL}/api/auth/oauth/github/callback`,
        scope: ['user:email'],
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: GitHubProfile,
        done: (error: Error | null, user?: IUser | false) => void
      ) => {
        try {
          const profileData = extractGitHubProfile(profile);
          
          if (!profileData.email) {
            return done(new Error('No email provided by GitHub. Please ensure your GitHub account has a public email or grant email permission.'));
          }

          const { user } = await findOrCreateOAuthUser('github', profileData, {
            accessToken,
            refreshToken,
          });

          done(null, user);
        } catch (error) {
          console.error('GitHub OAuth error:', error);
          done(error as Error);
        }
      }
    )
  );
  console.log('✅ GitHub OAuth strategy configured');
} else {
  console.log('⚠️ GitHub OAuth not configured (missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET)');
}

export default passport;

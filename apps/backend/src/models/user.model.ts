import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

// OAuth provider types
export type OAuthProvider = 'google' | 'microsoft' | 'github';

export interface OAuthAccount {
  provider: OAuthProvider;
  providerId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password?: string; // Optional for OAuth-only users
  name: string;
  avatar?: string;
  oauthAccounts: OAuthAccount[];
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  hasOAuthProvider(provider: OAuthProvider): boolean;
  getOAuthAccount(provider: OAuthProvider): OAuthAccount | undefined;
}

const oauthAccountSchema = new Schema<OAuthAccount>(
  {
    provider: {
      type: String,
      required: true,
      enum: ['google', 'microsoft', 'github'],
    },
    providerId: {
      type: String,
      required: true,
    },
    accessToken: {
      type: String,
      select: false, // Don't include tokens by default
    },
    refreshToken: {
      type: String,
      select: false,
    },
    tokenExpiresAt: {
      type: Date,
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      minlength: 8,
      select: false, // Don't include password by default in queries
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: {
      type: String,
    },
    oauthAccounts: {
      type: [oauthAccountSchema],
      default: [],
    },
    emailVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for OAuth lookups
userSchema.index({ 'oauthAccounts.provider': 1, 'oauthAccounts.providerId': 1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user has a specific OAuth provider linked
userSchema.methods.hasOAuthProvider = function (provider: OAuthProvider): boolean {
  return this.oauthAccounts.some((account: OAuthAccount) => account.provider === provider);
};

// Get OAuth account for a provider
userSchema.methods.getOAuthAccount = function (provider: OAuthProvider): OAuthAccount | undefined {
  return this.oauthAccounts.find((account: OAuthAccount) => account.provider === provider);
};

export const User = mongoose.model<IUser>('User', userSchema);

// Helper function to find or create user from OAuth profile
export async function findOrCreateOAuthUser(
  provider: OAuthProvider,
  profile: {
    id: string;
    email: string;
    name: string;
    avatar?: string;
  },
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
  }
): Promise<{ user: IUser; isNewUser: boolean; wasLinked: boolean }> {
  // First, try to find by OAuth provider ID
  let user = await User.findOne({
    'oauthAccounts.provider': provider,
    'oauthAccounts.providerId': profile.id,
  });

  if (user) {
    // Update tokens
    const accountIndex = user.oauthAccounts.findIndex((a) => a.provider === provider);
    if (accountIndex !== -1) {
      user.oauthAccounts[accountIndex].accessToken = tokens.accessToken;
      if (tokens.refreshToken) {
        user.oauthAccounts[accountIndex].refreshToken = tokens.refreshToken;
      }
      if (tokens.expiresAt) {
        user.oauthAccounts[accountIndex].tokenExpiresAt = tokens.expiresAt;
      }
      await user.save();
    }
    return { user, isNewUser: false, wasLinked: false };
  }

  // Try to find by email (for account linking)
  user = await User.findOne({ email: profile.email.toLowerCase() });

  if (user) {
    // Link the OAuth account to existing user
    user.oauthAccounts.push({
      provider,
      providerId: profile.id,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenExpiresAt: tokens.expiresAt,
    });
    
    // Update avatar if not set
    if (!user.avatar && profile.avatar) {
      user.avatar = profile.avatar;
    }
    
    // Mark email as verified since OAuth provider verified it
    user.emailVerified = true;
    
    await user.save();
    return { user, isNewUser: false, wasLinked: true };
  }

  // Create new user
  user = await User.create({
    email: profile.email.toLowerCase(),
    name: profile.name,
    avatar: profile.avatar,
    emailVerified: true, // OAuth provider has verified the email
    oauthAccounts: [
      {
        provider,
        providerId: profile.id,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        tokenExpiresAt: tokens.expiresAt,
      },
    ],
  });

  return { user, isNewUser: true, wasLinked: false };
}

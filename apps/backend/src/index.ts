import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';
import passport from './config/passport.js';
import authRoutes from './routes/auth.routes.js';
import oauthRoutes from './routes/oauth.routes.js';

const app = express();

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());

// Session middleware (required for passport OAuth flow)
app.use(session({
  secret: env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 10 * 60 * 1000, // 10 minutes - just for OAuth flow
  },
}));

// Initialize passport
app.use(passport.initialize());

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auth/oauth', oauthRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Start server
async function start() {
  await connectDatabase();
  
  app.listen(env.PORT, () => {
    console.log(`🚀 Backend server running at http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
  });
}

start().catch(console.error);

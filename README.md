# Veltria App

A monorepo for the Veltria application - the platform for AI-human collaboration.

## 🏗️ Architecture

This is a monorepo using **pnpm workspaces** and **Turborepo** for build orchestration.

```
veltria-app/
├── apps/
│   ├── frontend/          # React + TypeScript + Vite + TailwindCSS
│   └── backend/           # Node.js + TypeScript + Express + MongoDB
├── packages/
│   ├── shared/            # Shared types and utilities
│   ├── eslint-config/     # Shared ESLint configuration
│   └── typescript-config/ # Shared TypeScript configurations
├── turbo.json             # Turborepo configuration
└── pnpm-workspace.yaml    # pnpm workspace configuration
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
pnpm install

# Copy environment files
cp apps/backend/.env.example apps/backend/.env

# Edit .env with your MongoDB URI and JWT secret
```

### Development

```bash
# Run all apps in development mode
pnpm dev

# Run only frontend
pnpm --filter @veltria/frontend dev

# Run only backend
pnpm --filter @veltria/backend dev
```

### Build

```bash
# Build all packages
pnpm build
```

## 🔐 Authentication

The app includes a complete authentication system:

- **POST** `/api/auth/signup` - Create new account
- **POST** `/api/auth/login` - Login with email/password
- **POST** `/api/auth/logout` - Logout (stateless)
- **GET** `/api/auth/me` - Get current user (requires auth)

### API Response Format

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## 🛠️ Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- TailwindCSS
- React Router

### Backend
- Node.js
- TypeScript
- Express
- MongoDB with Mongoose
- JWT authentication
- Zod validation

## 📝 Environment Variables

### Backend (`apps/backend/.env`)

```env
PORT=3001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/veltria
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

## 🤝 Contributing

This project is built by Veltria - a collaboration between human (Manish) and AI (Serra).

## 📄 License

MIT

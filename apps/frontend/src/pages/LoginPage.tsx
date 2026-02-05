import { useState, FormEvent, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { isValidEmail } from '@veltria/shared';
import AuthLayout from '../components/AuthLayout';
import Input from '../components/Input';
import Button from '../components/Button';
import { OAuthButtonsGroup, AuthDivider } from '../components/OAuthButtons';

export default function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Handle OAuth error from redirect
  useEffect(() => {
    const oauthError = searchParams.get('error');
    if (oauthError) {
      setError(decodeURIComponent(oauthError));
      // Clean up URL
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Client-side validation
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoading(true);
    const result = await login({ email, password });
    setIsLoading(false);

    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed');
    }
  };

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to your Veltria account">
      {/* OAuth Buttons */}
      <OAuthButtonsGroup action="signin" className="mb-4" />

      <AuthDivider />

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit}>
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            {error}
          </div>
        )}

        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <div className="mb-6">
          <Link to="/forgot-password" className="text-sm text-veltria-green hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" isLoading={isLoading}>
          Sign In
        </Button>
      </form>

      <p className="mt-6 text-center text-gray-400 text-sm">
        Don't have an account?{' '}
        <Link to="/signup" className="text-veltria-green hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback } = useAuth();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const provider = searchParams.get('provider');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError(decodeURIComponent(errorParam));
      setTimeout(() => navigate('/login'), 3000);
      return;
    }

    if (token) {
      handleOAuthCallback(token)
        .then((result) => {
          if (result.success) {
            // Show success message briefly, then redirect
            navigate('/dashboard');
          } else {
            setError(result.error || 'Failed to complete authentication');
            setTimeout(() => navigate('/login'), 3000);
          }
        })
        .catch((err) => {
          console.error('OAuth callback error:', err);
          setError('An unexpected error occurred');
          setTimeout(() => navigate('/login'), 3000);
        });
    } else {
      setError('No authentication token received');
      setTimeout(() => navigate('/login'), 3000);
    }
  }, [searchParams, handleOAuthCallback, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-veltria-darker">
      {error ? (
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <div className="text-gray-400 text-sm">Redirecting to login...</div>
        </div>
      ) : (
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-3 border-veltria-green border-t-transparent rounded-full mx-auto mb-4" />
          <div className="text-white text-lg">Completing sign in...</div>
        </div>
      )}
    </div>
  );
}

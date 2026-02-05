import { useAuth } from '../hooks/useAuth';
import Button from '../components/Button';

export default function DashboardPage() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b border-white/5 bg-veltria-darker/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🌿</span>
            <span className="text-xl font-semibold">Veltria</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-gray-400 text-sm">{user?.email}</span>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Welcome back, <span className="gradient-text">{user?.name}</span>
          </h1>
          <p className="text-gray-400">Your AI-native workspace awaits.</p>
        </div>

        {/* Dashboard Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="text-3xl mb-4">🚀</div>
            <h3 className="text-lg font-semibold mb-2">Quick Start</h3>
            <p className="text-gray-400 text-sm">
              Get started with your first AI collaboration project.
            </p>
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="text-3xl mb-4">📊</div>
            <h3 className="text-lg font-semibold mb-2">Activity</h3>
            <p className="text-gray-400 text-sm">No recent activity yet. Start a project!</p>
          </div>

          <div className="p-6 bg-white/[0.02] border border-white/5 rounded-2xl">
            <div className="text-3xl mb-4">⚙️</div>
            <h3 className="text-lg font-semibold mb-2">Settings</h3>
            <p className="text-gray-400 text-sm">Configure your account and preferences.</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="p-8 bg-gradient-to-r from-veltria-green/10 to-transparent border border-veltria-green/20 rounded-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Ready to build something amazing?</h3>
              <p className="text-gray-400">
                Start collaborating with AI to bring your ideas to life.
              </p>
            </div>
            <Button className="w-auto">Create Project</Button>
          </div>
        </div>
      </main>
    </div>
  );
}

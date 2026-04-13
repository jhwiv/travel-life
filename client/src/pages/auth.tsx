import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Globe, Loader2 } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const [, navigate] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password, displayName);
      }
      navigate("/dashboard");
    } catch (err: any) {
      const msg = err.message || "Something went wrong";
      // Parse error message from API response
      try {
        const parsed = JSON.parse(msg.split(": ").slice(1).join(": "));
        setError(parsed.message || msg);
      } catch {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "linear-gradient(165deg, #0a0a1a 0%, #1a1040 30%, #0f1628 60%, #0a0a1a 100%)",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-purple-500/15 border border-purple-400/20 mb-4">
            <Globe className="w-7 h-7 text-purple-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Travel Life</h1>
          <p className="text-sm text-white/40 mt-1">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 transition-colors"
                placeholder="Your name"
                required={!isLogin}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 transition-colors"
              placeholder="username"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/50 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/10 text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 transition-colors"
              placeholder="••••••"
              required
              autoComplete={isLogin ? "current-password" : "new-password"}
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-2.5">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLogin ? "Sign In" : "Create Account"}
          </button>
        </form>

        {/* Toggle */}
        <div className="text-center mt-6">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
            className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
}

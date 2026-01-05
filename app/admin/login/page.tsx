"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Frontend validation (Manual)
    if (!email || !email.includes("@")) {
      setError("Enter a valid email");
      setLoading(false);
      return;
    }
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    // Call NextAuth credentials provider
    const result = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    // Redirect to admin dashboard
    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white px-4">
      <div className="w-full max-w-md space-y-8 p-10 bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-red-900/20 shadow-2xl relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />

        <div className="text-center relative">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 mb-6">
            <Shield className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
            Admin Access
          </h2>
          <p className="mt-2 text-zinc-500">Secure entry for system administrators</p>
        </div>

        <form className="mt-8 space-y-6 relative" onSubmit={handleSubmit}>
          {error && (
            <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 text-red-400 text-sm font-medium flex items-center justify-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                Admin Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl bg-black/40 border border-zinc-800 px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all placeholder-zinc-700"
                placeholder="admin@system.io"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2 ml-1">
                Master Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-2xl bg-black/40 border border-zinc-800 px-5 py-3.5 text-white focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500/40 transition-all placeholder-zinc-700"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white rounded-2xl font-bold text-sm shadow-[0_10px_20px_-10px_rgba(220,38,38,0.5)] transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Authenticating..." : "Establish Secure Session"}
          </button>
        </form>


      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PasswordStrength } from "@/components/password-strength";

export function AuthClient({ initialMode }: { initialMode: "login" | "signup" }) {
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMessage, setForgotMessage] = useState("");
  const router = useRouter();

  const weakPassword = useMemo(() => {
    const score =
      Number(password.length >= 8) +
      Number(/[A-Z]/.test(password)) +
      Number(/[a-z]/.test(password)) +
      Number(/\d/.test(password)) +
      Number(/[^A-Za-z0-9]/.test(password));
    return score <= 2;
  }, [password]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (mode === "signup" && weakPassword) {
      setLoading(false);
      setError("Password is too weak.");
      return;
    }

    const endpoint = mode === "signup" ? "/api/auth/signup" : "/api/auth/login";
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        displayName: displayName || email.split("@")[0] || "User",
        rememberMe,
      }),
    });

    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? "Invalid credentials");
      setLoading(false);
      return;
    }

    if (rememberMe) {
      window.localStorage.setItem("sn-remember-email", email);
    } else {
      window.localStorage.removeItem("sn-remember-email");
    }

    router.push("/dashboard");
    router.refresh();
  };

  const submitForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage("");
    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: forgotEmail }),
    });
    const body = await res.json();
    setForgotMessage(body.message ?? "Request sent.");
  };

  return (
    <main className="flex min-h-screen">
      <section className="relative hidden flex-1 overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 lg:flex">
        <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(white_1px,transparent_1px)] [background-size:24px_24px]" />
        <div className="relative z-10 m-auto max-w-md px-10 text-white">
          <div className="mb-6 inline-flex rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur">
            <span className="text-3xl">🔒</span>
          </div>
          <h1 className="text-4xl font-bold">Privacy-First Notes</h1>
          <p className="mt-3 text-white/85">
            End-to-end protected workflows for your notes, credentials, and activity.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-3 text-xs">
            <span className="rounded-full bg-white/15 px-3 py-2 text-center">Encrypted</span>
            <span className="rounded-full bg-white/15 px-3 py-2 text-center">Zero-Knowledge</span>
            <span className="rounded-full bg-white/15 px-3 py-2 text-center">Secure Vault</span>
          </div>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center bg-[#f8f8f8] px-6 py-10">
        <div className="w-full max-w-md">
          <h2 className="mb-4 text-center text-3xl font-semibold text-slate-900">
            {mode === "login" ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mb-6 text-center text-sm text-slate-500">
            {mode === "login"
              ? "Sign in to access your encrypted notes"
              : "Start your secure note-taking journey"}
          </p>

          <form onSubmit={submit} className="space-y-4" autoComplete="off">
            {mode === "signup" && (
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-700">Display Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Display name"
                  className="h-11 w-full rounded-lg border border-slate-300 bg-[#f2f2f2] px-3 text-slate-900 placeholder:text-slate-400"
                  autoComplete="off"
                />
              </div>
            )}
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-700">Email Address</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              className="h-11 w-full rounded-lg border border-slate-300 bg-[#f2f2f2] px-3 text-slate-900 placeholder:text-slate-400"
              autoComplete="off"
              required
            />
            </div>
            <div className="relative">
              <label className="mb-1 block text-xs font-medium text-slate-700">Password</label>
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                className="h-11 w-full rounded-lg border border-slate-400 bg-[#f2f2f2] px-3 pr-24 text-slate-900 placeholder:text-slate-400"
                autoComplete={mode === "signup" ? "new-password" : "off"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2 top-[68%] -translate-y-1/2 rounded-md border border-slate-300 px-2 py-1 text-xs"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            {mode === "login" && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 text-slate-600">
                  <input
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    type="checkbox"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setForgotOpen(true);
                    setForgotEmail(email);
                    setForgotMessage("");
                  }}
                  className="font-medium text-slate-800"
                >
                  Forgot password?
                </button>
              </div>
            )}
            {mode === "signup" && <PasswordStrength password={password} />}
            {error && <p className="text-sm text-rose-500">{error}</p>}
            <button
              disabled={loading}
              className="h-11 w-full rounded-lg bg-[#020617] font-semibold text-white hover:opacity-95 disabled:opacity-60"
            >
              {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-slate-500">
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              type="button"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
              className="font-semibold text-slate-900 hover:underline"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </p>
        </div>
      </section>

      {forgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold text-slate-900">Reset Password</h3>
            <p className="mt-1 text-sm text-slate-600">
              Enter your email and we will send a reset link.
            </p>
            <form onSubmit={submitForgotPassword} className="mt-4 space-y-3">
              <input
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-slate-900"
                required
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setForgotOpen(false)}
                  className="inline-flex h-9 items-center justify-center rounded-md border border-slate-300 bg-white px-4 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="inline-flex h-9 items-center justify-center rounded-md border border-cyan-200 bg-cyan-50 px-4 text-sm font-medium text-cyan-700 transition hover:bg-cyan-100"
                >
                  Send Link
                </button>
              </div>
            </form>
            {forgotMessage && <p className="mt-3 text-sm text-slate-700">{forgotMessage}</p>}
          </div>
        </div>
      )}
    </main>
  );
}

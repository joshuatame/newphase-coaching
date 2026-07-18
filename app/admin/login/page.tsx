"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/api/newphase";
import { isAuthenticated } from "@/lib/api/client";
import { AdminButton, Field, TextInput } from "@/components/admin/ui";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "sending">("idle");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated()) router.replace("/admin/");
  }, [router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("sending");
    setError("");
    try {
      await login(email, password);
      router.replace("/admin/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Invalid email or password.",
      );
      setStatus("idle");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 block text-center font-display text-3xl tracking-wide text-off-white"
        >
          NEW<span className="text-accent">PHASE</span>
        </Link>
        <div className="rounded-2xl surface-carbon p-8">
          <h1 className="font-display text-2xl tracking-wide text-off-white">
            Admin Login
          </h1>
          <p className="mt-1 text-sm text-steel">
            Sign in to manage NewPhase Coaching.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <Field label="Email">
              <TextInput
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@newphasecoaching.com"
                autoComplete="email"
              />
            </Field>
            <Field label="Password">
              <TextInput
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </Field>

            {error && (
              <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            )}

            <AdminButton
              type="submit"
              disabled={status === "sending"}
              className="w-full"
            >
              {status === "sending" ? "Signing in…" : "Sign In"}
            </AdminButton>
          </form>
        </div>
        <Link
          href="/"
          className="mt-6 block text-center text-sm text-steel hover:text-off-white"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}

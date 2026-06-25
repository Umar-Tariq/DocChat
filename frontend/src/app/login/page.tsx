"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email"));
    const password = String(formData.get("password"));

    try {
      await login(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-6 py-16">
      <AuthForm
        title="Welcome back"
        subtitle="Log in to access your documents and chat history."
        submitLabel="Log in"
        error={error}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
      />
      <p className="mt-6 text-center text-sm text-zinc-400">
        No account?{" "}
        <Link href="/signup" className="text-indigo-400 hover:text-indigo-300">
          Sign up
        </Link>
      </p>
    </div>
  );
}

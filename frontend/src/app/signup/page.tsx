"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AuthForm } from "@/components/AuthForm";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  const { register } = useAuth();
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
    const name = String(formData.get("name") || "");

    try {
      await register(email, password, name);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="px-6 py-16">
      <AuthForm
        title="Create your account"
        subtitle="Start chatting with your documents in minutes."
        submitLabel="Sign up"
        error={error}
        isSubmitting={isSubmitting}
        onSubmit={handleSubmit}
        showName
      />
      <p className="mt-6 text-center text-sm text-zinc-400">
        Already have an account?{" "}
        <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
          Log in
        </Link>
      </p>
    </div>
  );
}

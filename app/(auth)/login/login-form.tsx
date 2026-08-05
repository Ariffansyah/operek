"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const supabase = createClient();
          const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) {
            setError("Email atau kata sandi salah.");
            return;
          }
          router.push(next);
          router.refresh();
        });
      }}
    >
      <Field label="Email" htmlFor="email">
        <Input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nama@email.com"
        />
      </Field>

      <Field label="Kata Sandi" htmlFor="password">
        <Input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>

      <div className="text-right">
        <Link
          href="/forgot-password"
          className="text-xs font-semibold text-brand-600 hover:underline"
        >
          Lupa kata sandi?
        </Link>
      </div>

      {error && (
        <p aria-live="polite" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" pill disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Masuk
      </Button>
    </form>
  );
}

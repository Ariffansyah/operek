"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const supabase = createClient();
          await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/auth/callback?next=/settings?tab=sandi`,
          });
          setMessage("Kalau emailnya terdaftar, link reset sudah kami kirim.");
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

      {message && (
        <p aria-live="polite" className="text-sm text-brand-700">
          {message}
        </p>
      )}

      <Button type="submit" size="lg" pill disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Kirim Link Reset
      </Button>
    </form>
  );
}

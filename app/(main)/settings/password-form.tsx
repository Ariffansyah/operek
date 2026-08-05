"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button, Field, Input } from "@/components/ui";
import { changePassword } from "@/lib/actions";

export function PasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();

  return (
    <form
      className="max-w-sm space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (password !== confirm) {
          setMessage("Konfirmasi kata sandi tidak cocok.");
          return;
        }
        startSaving(async () => {
          const result = await changePassword(password);
          setMessage(result?.error ?? "Kata sandi berhasil diganti.");
          if (!result?.error) {
            setPassword("");
            setConfirm("");
          }
        });
      }}
    >
      <Field label="Kata Sandi Baru" htmlFor="password">
        <Input
          id="password"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
        />
      </Field>

      <Field label="Konfirmasi Kata Sandi" htmlFor="confirm">
        <Input
          id="confirm"
          type="password"
          minLength={8}
          required
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </Field>

      <Button type="submit" pill disabled={saving}>
        {saving && <Loader2 className="size-4 animate-spin" />}
        Simpan Kata Sandi
      </Button>

      {message && (
        <p aria-live="polite" className="text-sm text-gray-500">
          {message}
        </p>
      )}
    </form>
  );
}

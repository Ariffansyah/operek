"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { CAMPUSES, STATUSES, cn } from "@/lib/utils";

export function RegisterForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [university, setUniversity] = useState("");
  const [major, setMajor] = useState("");
  const [status, setStatus] = useState<string>(STATUSES[0]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <form
      className="mt-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const supabase = createClient();
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName, university, major, status },
              emailRedirectTo: `${window.location.origin}/auth/callback`,
            },
          });

          if (error) {
            setError(error.message);
            return;
          }
          if (!data.session) {
            setNotice("Cek emailmu untuk konfirmasi akun.");
            return;
          }
          router.push("/");
          router.refresh();
        });
      }}
    >
      <Field label="Nama Lengkap" htmlFor="fullName">
        <Input
          id="fullName"
          required
          autoComplete="name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Cth: Maya Rodriguez"
        />
      </Field>

      <Field label="Universitas" htmlFor="university">
        <Select
          id="university"
          required
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
        >
          <option value="">Pilih universitas</option>
          {CAMPUSES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </Select>
      </Field>

      <Field label="Jurusan" htmlFor="major">
        <Input
          id="major"
          required
          value={major}
          onChange={(e) => setMajor(e.target.value)}
          placeholder="Cth: Ilmu Komputer"
        />
      </Field>

      <fieldset>
        <legend className="mb-1.5 text-xs font-semibold text-ink-900">Status</legend>
        <div className="grid grid-cols-2 gap-3">
          {STATUSES.map((s) => (
            <label
              key={s}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-field border p-3 text-sm font-semibold transition-colors",
                status === s
                  ? "border-brand-500 bg-brand-50 text-brand-700"
                  : "border-gray-200 text-gray-600 hover:bg-gray-50",
              )}
            >
              <input
                type="radio"
                name="status"
                value={s}
                checked={status === s}
                onChange={() => setStatus(s)}
                className="size-4 accent-brand-500"
              />
              {s}
            </label>
          ))}
        </div>
      </fieldset>

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
          minLength={8}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Minimal 8 karakter"
        />
      </Field>

      {error && (
        <p aria-live="polite" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {notice && (
        <p aria-live="polite" className="text-sm text-brand-700">
          {notice}
        </p>
      )}

      <Button type="submit" size="lg" pill disabled={pending} className="w-full">
        {pending && <Loader2 className="size-4 animate-spin" />}
        Buat Akun
      </Button>
    </form>
  );
}

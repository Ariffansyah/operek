"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Camera, Loader2 } from "lucide-react";
import { Button, Field, Input, Select } from "@/components/ui";
import { updateProfile, uploadAvatar } from "@/lib/actions";
import { CAMPUSES } from "@/lib/utils";
import type { Profile } from "@/lib/types";

export function AccountForm({
  profile,
  email,
}: {
  profile: Profile | null;
  email: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? null);
  const [firstName, setFirstName] = useState(
    profile?.full_name?.split(" ")[0] ?? "",
  );
  const [lastName, setLastName] = useState(
    profile?.full_name?.split(" ").slice(1).join(" ") ?? "",
  );
  const [university, setUniversity] = useState(profile?.university ?? "");
  const [major, setMajor] = useState(profile?.major ?? "");
  const [message, setMessage] = useState<string | null>(null);
  const [saving, startSaving] = useTransition();
  const [uploading, startUploading] = useTransition();

  return (
    <form
      className="space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        startSaving(async () => {
          const result = await updateProfile({
            full_name: [firstName, lastName].filter(Boolean).join(" "),
            university,
            major,
          });
          setMessage(result?.ok ? "Perubahan tersimpan." : "Gagal menyimpan.");
          router.refresh();
        });
      }}
    >
      <div className="flex items-center gap-4">
        <span className="relative size-14 shrink-0 overflow-hidden rounded-full bg-brand-50">
          {avatar ? (
            <Image src={avatar} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-lg font-bold text-brand-700">
              {(firstName[0] ?? "?").toUpperCase()}
            </span>
          )}
        </span>

        <div>
          <button
            type="button"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            className="flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700 disabled:text-gray-400"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Camera className="size-4" />
            )}
            Ganti foto
          </button>
          <p className="mt-0.5 text-xs text-gray-400">JPG atau PNG, maks 5MB</p>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            startUploading(async () => {
              const formData = new FormData();
              formData.set("file", file);
              const result = await uploadAvatar(formData);
              if (result?.error) setMessage(result.error);
              else if (result?.url) setAvatar(result.url);
              router.refresh();
            });
          }}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Nama Depan" htmlFor="firstName">
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
          />
        </Field>
        <Field label="Nama Belakang" htmlFor="lastName">
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
          />
        </Field>
      </div>

      <Field label="Email" htmlFor="email">
        <Input id="email" value={email} disabled readOnly />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Universitas" htmlFor="university">
          <Select
            id="university"
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
            value={major}
            onChange={(e) => setMajor(e.target.value)}
            placeholder="Cth: Ilmu Komputer"
          />
        </Field>
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" pill disabled={saving}>
          {saving && <Loader2 className="size-4 animate-spin" />}
          Simpan Perubahan
        </Button>
        {message && (
          <p aria-live="polite" className="text-sm text-gray-500">
            {message}
          </p>
        )}
      </div>
    </form>
  );
}

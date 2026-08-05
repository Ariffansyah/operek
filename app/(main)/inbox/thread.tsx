"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Send } from "lucide-react";
import { Avatar } from "@/components/layout/header";
import { markThreadRead, sendMessage } from "@/lib/actions";
import { cn } from "@/lib/utils";
import type { Listing, Message, Profile } from "@/lib/types";

const POLL_MS = 5000;

export function Thread({
  currentUserId,
  other,
  listing,
  initialMessages,
  hasUnread,
}: {
  currentUserId: string;
  other: Profile;
  listing: Listing | null;
  initialMessages: Message[];
  hasUnread: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [sending, startSending] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const id = setInterval(() => router.refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [router]);

  const listingId = listing?.id ?? null;
  useEffect(() => {
    if (!hasUnread) return;
    void markThreadRead(other.id, listingId).then(() => router.refresh());
  }, [hasUnread, other.id, listingId, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [initialMessages.length]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const content = draft.trim();
    if (!content) return;
    setDraft("");
    startSending(async () => {
      await sendMessage({
        receiverId: other.id,
        listingId: listing?.id ?? null,
        content,
      });
      router.refresh();
    });
  }

  return (
    <div className="flex min-h-0 flex-col bg-gray-50">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-3">
        <Avatar profile={other} size={36} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-ink-900">
            {other.full_name}
          </p>
          {listing && (
            <p className="truncate text-xs text-gray-500">Ttg: {listing.title}</p>
          )}
        </div>
        {listing && (
          <Link
            href={`/product/${listing.id}`}
            className="shrink-0 rounded-full border border-brand-500 px-3 py-1.5 text-xs font-semibold text-brand-700 hover:bg-brand-50"
          >
            Lihat Iklan
          </Link>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {initialMessages.map((m) => {
          const mine = m.sender_id === currentUserId;
          return (
            <div
              key={m.id}
              className={cn("flex items-end gap-2", mine && "flex-row-reverse")}
            >
              {!mine && <Avatar profile={other} size={24} />}
              <div className={cn("max-w-[75%]", mine && "text-right")}>
                <p
                  className={cn(
                    "inline-block rounded-2xl px-3.5 py-2 text-left text-sm leading-5",
                    mine
                      ? "bg-brand-500 text-white"
                      : "border border-gray-100 bg-white text-ink-900",
                  )}
                >
                  {m.content}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">
                  {new Date(m.created_at).toLocaleTimeString("id-ID", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={submit}
        className="flex items-center gap-2 border-t border-gray-100 bg-white p-3"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Tulis pesan..."
          aria-label="Tulis pesan"
          className="h-11 flex-1 rounded-full bg-gray-50 px-4 text-sm outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="submit"
          disabled={sending || !draft.trim()}
          aria-label="Kirim"
          className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-500 text-white transition-colors hover:bg-brand-600 disabled:bg-gray-200 disabled:text-gray-400"
        >
          {sending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Send className="size-4" />
          )}
        </button>
      </form>
    </div>
  );
}

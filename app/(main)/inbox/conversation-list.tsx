"use client";

import Link from "next/link";
import { Avatar } from "@/components/layout/header";
import { cn, timeAgo } from "@/lib/utils";
import type { Listing, Message, Profile } from "@/lib/types";

type Conversation = {
  otherId: string;
  listingId: string | null;
  last: Message;
  unread: number;
  other: Profile | null;
  listing: Listing | null;
};

export function ConversationList({
  conversations,
  activeOtherId,
  activeListingId,
  draft,
}: {
  conversations: Conversation[];
  activeOtherId: string | null;
  activeListingId: string | null;
  draft?: { other: Profile; listing: Listing | null } | null;
}) {
  return (
    <ul className="min-h-0 overflow-y-auto border-b border-gray-100 bg-white md:border-b-0 md:border-r">
      {draft && (
        <li>
          <div className="flex gap-3 border-b border-gray-100 border-l-2 border-l-brand-500 bg-brand-50 p-3.5">
            <Avatar profile={draft.other} size={36} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-ink-900">
                {draft.other.full_name ?? "Pengguna"}
              </p>
              {draft.listing && (
                <p className="truncate text-xs font-semibold text-brand-600">
                  {draft.listing.title}
                </p>
              )}
              <p className="truncate text-xs text-gray-400">Percakapan baru</p>
            </div>
          </div>
        </li>
      )}
      {conversations.map((c) => {
        const active =
          c.otherId === activeOtherId && c.listingId === activeListingId;
        const href = `/inbox?to=${c.otherId}${c.listingId ? `&listing=${c.listingId}` : ""}`;

        return (
          <li key={`${c.otherId}:${c.listingId ?? ""}`}>
            <Link
              href={href}
              className={cn(
                "flex gap-3 border-b border-gray-100 p-3.5 transition-colors",
                active
                  ? "border-l-2 border-l-brand-500 bg-brand-50"
                  : "hover:bg-gray-50",
              )}
            >
              <div className="relative shrink-0">
                <Avatar profile={c.other} size={36} />
                {c.unread > 0 && (
                  <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-accent-500 text-[10px] font-bold text-white">
                    {c.unread}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-ink-900">
                    {c.other?.full_name ?? "Pengguna"}
                  </p>
                  <span className="shrink-0 text-[11px] text-gray-400">
                    {timeAgo(c.last.created_at)}
                  </span>
                </div>
                {c.listing && (
                  <p className="truncate text-xs font-semibold text-brand-600">
                    {c.listing.title}
                  </p>
                )}
                <p className="truncate text-xs text-gray-500">{c.last.content}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

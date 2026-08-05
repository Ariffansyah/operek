import { redirect } from "next/navigation";
import { MessageSquare } from "lucide-react";
import { EmptyState } from "@/components/ui";
import { ConversationList } from "./conversation-list";
import { Thread } from "./thread";
import {
  getConversations,
  getListing,
  getProfile,
  getSession,
  getThread,
} from "@/lib/data";

export default async function InboxPage(props: PageProps<"/inbox">) {
  const session = await getSession();
  if (!session) redirect("/login?next=/inbox");

  const params = await props.searchParams;
  const conversations = await getConversations(session.user.id);

  const toParam = Array.isArray(params.to) ? params.to[0] : params.to;
  const listingParam = Array.isArray(params.listing)
    ? params.listing[0]
    : params.listing;

  const activeOtherId = toParam ?? conversations[0]?.otherId ?? null;
  const activeListingId =
    listingParam ??
    (toParam
      ? null
      : (conversations[0]?.listingId ?? null));

  const [messages, other, listing] = activeOtherId
    ? await Promise.all([
        getThread(session.user.id, activeOtherId, activeListingId),
        getProfile(activeOtherId),
        activeListingId ? getListing(activeListingId) : Promise.resolve(null),
      ])
    : [[], null, null];

  const activeUnread =
    conversations.find(
      (c) => c.otherId === activeOtherId && c.listingId === activeListingId,
    )?.unread ?? 0;

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return (
    <div className="mx-auto flex h-[calc(100dvh-4rem)] max-w-[1200px] flex-col">
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
        <MessageSquare className="size-5 text-brand-500" />
        <h1 className="text-xl font-bold text-ink-900">Pesan Masuk</h1>
        {totalUnread > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
            {totalUnread}
          </span>
        )}
      </div>

      {other || conversations.length ? (
        <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-[280px_minmax(0,1fr)]">
          <ConversationList
            conversations={conversations}
            activeOtherId={activeOtherId}
            activeListingId={activeListingId}
            draft={
              other &&
              !conversations.some(
                (c) =>
                  c.otherId === activeOtherId && c.listingId === activeListingId,
              )
                ? { other, listing }
                : null
            }
          />
          {other ? (
            <Thread
              key={`${activeOtherId}:${activeListingId ?? ""}`}
              currentUserId={session.user.id}
              other={other}
              listing={listing}
              initialMessages={messages}
              hasUnread={activeUnread > 0}
            />
          ) : (
            <div className="hidden items-center justify-center text-sm text-gray-500 md:flex">
              Pilih percakapan.
            </div>
          )}
        </div>
      ) : (
        <div className="p-6">
          <EmptyState
            icon={<MessageSquare className="size-5" />}
            title="Belum ada pesan"
            description="Chat penjual dari halaman barang untuk mulai percakapan."
          />
        </div>
      )}
    </div>
  );
}

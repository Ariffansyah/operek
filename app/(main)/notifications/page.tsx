import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, CheckCircle2, Heart, MessageCircle, Receipt } from "lucide-react";
import { Card, EmptyState } from "@/components/ui";
import { MarkAllRead } from "./mark-all-read";
import { getNotificationFeed, type Feed } from "@/lib/notifications";
import { getSession } from "@/lib/data";
import { timeAgo } from "@/lib/utils";

const ICONS: Record<Feed["kind"], { icon: typeof Bell; tone: string }> = {
  message: { icon: MessageCircle, tone: "bg-blue-50 text-blue-600" },
  sold: { icon: CheckCircle2, tone: "bg-emerald-100 text-emerald-700" },
  saved: { icon: Heart, tone: "bg-pink-50 text-pink-600" },
  paid: { icon: Receipt, tone: "bg-purple-50 text-purple-600" },
};

export default async function NotificationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/notifications");

  const feed = await getNotificationFeed(session.user.id);
  const unread = feed.filter((f) => f.unread).length;

  return (
    <div>
      <div className="flex items-center gap-3 border-b border-gray-100 bg-white px-4 py-4 sm:px-6">
        <Bell className="size-5 text-brand-500" />
        <h1 className="text-xl font-bold text-ink-900">Notifikasi</h1>
        {unread > 0 && (
          <span className="flex size-5 items-center justify-center rounded-full bg-accent-500 text-xs font-bold text-white">
            {unread}
          </span>
        )}
        <div className="flex-1" />
        {unread > 0 && <MarkAllRead />}
      </div>

      <div className="mx-auto max-w-[640px] px-4 py-8">
        {feed.length ? (
          <ul className="space-y-3">
            {feed.map((item) => {
              const { icon: Icon, tone } = ICONS[item.kind];
              return (
                <li key={item.id}>
                  <Link href={item.href}>
                    <Card
                      className={`flex items-start gap-3.5 p-4 transition-shadow hover:shadow-sm ${
                        item.unread ? "bg-white" : "bg-white/60"
                      }`}
                    >
                      <span
                        className={`flex size-9 shrink-0 items-center justify-center rounded-full ${tone}`}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-ink-900">{item.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-sm text-gray-500">
                          {item.body}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-xs text-gray-400">
                          {item.createdAt === new Date(0).toISOString()
                            ? ""
                            : timeAgo(item.createdAt)}
                        </span>
                        {item.unread && (
                          <span className="size-2 rounded-full bg-accent-500" />
                        )}
                      </div>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState
            icon={<Bell className="size-5" />}
            title="Belum ada notifikasi"
            description="Kabar soal pesan, penjualan, dan pembayaran bakal muncul di sini."
          />
        )}
      </div>
    </div>
  );
}

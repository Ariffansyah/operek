import { Header } from "@/components/layout/header";
import { LiveRefresh } from "@/components/layout/live-refresh";
import { MobileNav } from "@/components/layout/nav-links";
import { getCartCount, getSession, getUnreadMessageCount } from "@/lib/data";
import { getUnreadNotificationCount } from "@/lib/notifications";

export default async function MainLayout({ children }: LayoutProps<"/">) {
  const session = await getSession();
  const [cartCount, unreadMessages, unreadNotifications] = session
    ? await Promise.all([
        getCartCount(session.user.id),
        getUnreadMessageCount(session.user.id),
        getUnreadNotificationCount(session.user.id),
      ])
    : [0, 0, 0];

  return (
    <>
      <Header
        profile={session?.profile ?? null}
        cartCount={cartCount}
        unreadMessages={unreadMessages}
        unreadNotifications={unreadNotifications}
      />
      <main className="flex-1 bg-gray-50 pb-16 md:pb-0">{children}</main>
      <MobileNav cartCount={cartCount} />
      {session && <LiveRefresh />}
    </>
  );
}

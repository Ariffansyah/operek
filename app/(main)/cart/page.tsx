import { ShoppingCart } from "lucide-react";
import { ButtonLink, EmptyState } from "@/components/ui";
import { CartView } from "./cart-view";
import { getCart, getSession } from "@/lib/data";

export default async function CartPage() {
  const session = await getSession();
  const items = session ? await getCart(session.user.id) : [];

  return (
    <div className="mx-auto max-w-[1024px] px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold text-ink-900 sm:text-3xl">
        Keranjang Belanja
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        {items.length} barang siap diambil
      </p>

      <div className="mt-6">
        {items.length ? (
          <CartView items={items} />
        ) : (
          <EmptyState
            icon={<ShoppingCart className="size-5" />}
            title="Keranjangmu masih kosong"
            description="Cari barang yang kamu butuhin, terus tambahin ke keranjang."
            action={
              <ButtonLink href="/discover" className="mt-2">
                Mulai Belanja
              </ButtonLink>
            }
          />
        )}
      </div>
    </div>
  );
}

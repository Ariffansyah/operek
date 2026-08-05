export type Profile = {
  id: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
  status: "Mahasiswa Aktif" | "Alumni";
  avatar_url: string | null;
  rating: number;
  total_sold: number;
  is_verified: boolean;
  notification_prefs: {
    messages: boolean;
    listings: boolean;
    sales: boolean;
    newsletter: boolean;
  };
  created_at: string;
};

export type Listing = {
  id: string;
  seller_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  delivery: string[];
  campus: string | null;
  images: string[] | null;
  is_active: boolean;
  created_at: string;
  seller?: Pick<
    Profile,
    "id" | "full_name" | "avatar_url" | "rating" | "university" | "status"
  > | null;
};

export type CartItem = {
  id: string;
  user_id: string;
  listing_id: string;
  quantity: number;
  listing: Listing | null;
};

export type Transaction = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  status: "pending" | "diproses" | "selesai" | "dibatalkan";
  delivery_method: string | null;
  total: number;
  platform_fee: number;
  paymenku_invoice_id: string | null;
  paymenku_payment_url: string | null;
  paid_at: string | null;
  created_at: string;
  listing?: Listing | null;
  buyer?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  seller?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

export type Message = {
  id: string;
  sender_id: string;
  receiver_id: string;
  listing_id: string | null;
  content: string;
  is_read: boolean;
  created_at: string;
};

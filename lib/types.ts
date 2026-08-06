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
  is_admin: boolean;
  notification_prefs: {
    messages: boolean;
    listings: boolean;
    sales: boolean;
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
  status: "pending" | "diproses" | "dikirim" | "selesai" | "dibatalkan";
  delivery_method: string | null;
  total: number;
  platform_fee: number;
  paymenku_invoice_id: string | null;
  paymenku_payment_url: string | null;
  paid_at: string | null;
  shipped_at: string | null;
  created_at: string;
  listing?: Listing | null;
  buyer?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
  seller?: Pick<Profile, "id" | "full_name" | "avatar_url"> | null;
};

export type Withdrawal = {
  id: string;
  seller_id: string;
  amount: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: "pending" | "selesai" | "ditolak";
  note: string | null;
  requested_at: string;
  processed_at: string | null;
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

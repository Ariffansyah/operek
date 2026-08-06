create table profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  university text,
  major text,
  status text check (status in ('Mahasiswa Aktif', 'Alumni')) default 'Mahasiswa Aktif',
  avatar_url text,
  rating numeric default 0,
  total_sold integer default 0,
  is_verified boolean default false,
  is_admin boolean default false,
  notification_prefs jsonb default '{"messages":true,"listings":true,"sales":false}',
  created_at timestamptz default now()
);

create table listings (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references profiles(id) on delete cascade,
  title text not null,
  description text,
  price integer not null,
  category text check (category in ('Buku','Elektronik','Furnitur','Sepeda','Pakaian','Lainnya')),
  condition text check (condition in ('Seperti Baru','Bagus','Cukup Baik','Bekas')),
  delivery text[] default '{cod}',
  campus text,
  images text[],
  is_active boolean default true,
  created_at timestamptz default now()
);

create table cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  quantity integer default 1,
  created_at timestamptz default now(),
  unique(user_id, listing_id)
);

create table transactions (
  id uuid default gen_random_uuid() primary key,
  buyer_id uuid references profiles(id),
  seller_id uuid references profiles(id),
  listing_id uuid references listings(id),
  status text check (status in ('pending','diproses','dikirim','selesai','dibatalkan')) default 'pending',
  delivery_method text,
  total integer,
  platform_fee integer,
  paymenku_invoice_id text,
  paymenku_payment_url text,
  paid_at timestamptz,
  shipped_at timestamptz,
  created_at timestamptz default now()
);

create table messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references profiles(id),
  receiver_id uuid references profiles(id),
  listing_id uuid references listings(id),
  content text not null,
  is_read boolean default false,
  created_at timestamptz default now()
);

create table reviews (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references transactions(id),
  reviewer_id uuid references profiles(id),
  reviewed_id uuid references profiles(id),
  rating integer check (rating between 1 and 5),
  comment text,
  created_at timestamptz default now()
);

create table saved_listings (
  user_id uuid references profiles(id) on delete cascade,
  listing_id uuid references listings(id) on delete cascade,
  primary key (user_id, listing_id)
);

create table withdrawals (
  id uuid default gen_random_uuid() primary key,
  seller_id uuid references profiles(id) on delete cascade,
  amount integer not null check (amount > 0),
  bank_name text not null,
  account_number text not null,
  account_name text not null,
  status text check (status in ('pending','selesai','ditolak')) default 'pending',
  note text,
  requested_at timestamptz default now(),
  processed_at timestamptz
);

create index on withdrawals (seller_id, requested_at desc);
create index on withdrawals (status, requested_at);

create index on listings (category, is_active, created_at desc);
create index on listings (seller_id);
create index on cart_items (user_id);
create index on transactions (buyer_id, created_at desc);
create index on transactions (seller_id, created_at desc);

create unique index transactions_one_active_per_listing
  on transactions (listing_id)
  where status in ('pending', 'diproses', 'dikirim', 'selesai');
create index on messages (receiver_id, is_read);
create index on messages (sender_id, receiver_id, listing_id, created_at);

create function public.handle_new_user() returns trigger
  language plpgsql
  security definer
  set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, university, major, status)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'university',
    new.raw_user_meta_data->>'major',
    coalesce(new.raw_user_meta_data->>'status', 'Mahasiswa Aktif')
  );
  return new;
exception
  when others then
    raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
    return new;
end;
$$;

alter function public.handle_new_user() owner to postgres;
grant usage on schema public to supabase_auth_admin;
grant execute on function public.handle_new_user() to supabase_auth_admin;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

insert into storage.buckets (id, name, public)
values ('listing-images', 'listing-images', true), ('avatars', 'avatars', true)
on conflict (id) do nothing;

revoke all on all tables in schema public from anon, authenticated;
alter default privileges in schema public revoke all on tables from anon, authenticated;

alter publication supabase_realtime add table messages;

-- Tabel dibuat otomatis oleh API saat pertama dipakai.
-- File ini hanya untuk referensi / kalau mau membuatnya manual di Neon SQL editor.
create table if not exists sekepal_entries (
  id bigserial primary key,
  family_code text not null,
  member_name text not null,
  input jsonb not null,
  output jsonb not null,
  created_at timestamptz not null default now()
);
create index if not exists sekepal_entries_family_idx
  on sekepal_entries (family_code, created_at desc);

-- Catatan makan harian
create table if not exists sekepal_logs (
  id bigserial primary key,
  family_code text not null,
  member_key text not null,      -- nama panggilan, huruf kecil
  log_date date not null,
  meal text not null,            -- sarapan | siang | malam | camilan
  food_id text not null,
  amount real not null,          -- dalam satuan tangan / butir / ekor
  fried boolean not null default false,
  kcal real not null,
  protein real not null,
  carb real not null,
  fat real not null,
  fiber real not null,
  created_at timestamptz not null default now()
);
create index if not exists sekepal_logs_member_idx
  on sekepal_logs (family_code, member_key, log_date);

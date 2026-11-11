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

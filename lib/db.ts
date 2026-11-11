import { neon } from "@neondatabase/serverless";

// Vercel → Storage → Neon (Postgres) otomatis mengisi DATABASE_URL.
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL;

export const dbEnabled = Boolean(url);

let ready: Promise<unknown> | null = null;

export function sql() {
  if (!url) throw new Error("DATABASE_URL belum di-set");
  return neon(url);
}

/** Bikin tabel kalau belum ada. Dipanggil sekali per instance. */
export function ensureSchema() {
  if (!ready) {
    const q = sql();
    ready = (async () => {
      await q`create table if not exists sekepal_entries (
        id bigserial primary key,
        family_code text not null,
        member_name text not null,
        input jsonb not null,
        output jsonb not null,
        created_at timestamptz not null default now()
      )`;
      await q`create index if not exists sekepal_entries_family_idx
        on sekepal_entries (family_code, created_at desc)`;
      await q`create table if not exists sekepal_logs (
        id bigserial primary key,
        family_code text not null,
        member_key text not null,
        log_date date not null,
        meal text not null,
        food_id text not null,
        amount real not null,
        fried boolean not null default false,
        kcal real not null,
        protein real not null,
        carb real not null,
        fat real not null,
        fiber real not null,
        created_at timestamptz not null default now()
      )`;
      // kolom tingkat manis ditambahkan belakangan; aman dijalankan berulang
      await q`alter table sekepal_logs add column if not exists sweet smallint`;
      await q`create index if not exists sekepal_logs_member_idx
        on sekepal_logs (family_code, member_key, log_date)`;
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

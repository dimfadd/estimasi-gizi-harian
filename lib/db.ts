import { neon } from "@neondatabase/serverless";
import { Pool } from "pg";

// Produksi: Vercel → Storage → Neon (Postgres) mengisi DATABASE_URL.
// Lokal/uji: DATABASE_URL ke Postgres biasa (localhost) memakai driver pg.
const url = process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
export const dbEnabled = Boolean(url);

const isLocal = /@(localhost|127\.0\.0\.1)[:/]/.test(url);

type Row = Record<string, unknown>;
type Runner = (text: string, params: unknown[]) => Promise<Row[]>;

let runner: Runner | null = null;
function getRunner(): Runner {
  if (runner) return runner;
  if (!url) throw new Error("DATABASE_URL belum di-set");
  if (isLocal) {
    const pool = new Pool({ connectionString: url, max: 5 });
    runner = async (text, params) => (await pool.query(text, params)).rows;
  } else {
    const q = neon(url);
    runner = async (text, params) => (await q.query(text, params)) as Row[];
  }
  return runner;
}

/**
 * Tagged template: sql`select * from t where id = ${id}`.
 * Nilai selalu dikirim sebagai parameter ($1, $2, …), tidak pernah ditempel ke teks SQL.
 */
export async function sql<T = Row>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> {
  let text = strings[0];
  for (let i = 0; i < values.length; i++) text += `$${i + 1}${strings[i + 1]}`;
  await ensureSchema();
  return (await getRunner()(text, values)) as T[];
}

/* ------------------------------------------------------------------ skema */

// Urutan migrasi: hanya boleh DITAMBAH di akhir, jangan mengubah yang sudah ada.
const MIGRATIONS: string[] = [
  // 1 — tabel lama (kode keluarga), dipertahankan untuk fitur "klaim data lama"
  `create table if not exists sekepal_entries (
     id bigserial primary key, family_code text not null, member_name text not null,
     input jsonb not null, output jsonb not null, created_at timestamptz not null default now())`,
  `create table if not exists sekepal_logs (
     id bigserial primary key, family_code text not null, member_key text not null, log_date date not null,
     meal text not null, food_id text not null, amount real not null, fried boolean not null default false,
     kcal real not null, protein real not null, carb real not null, fat real not null, fiber real not null,
     created_at timestamptz not null default now())`,
  `alter table sekepal_logs add column if not exists sweet smallint`,

  // 2 — akun & data per akun
  `create table if not exists users (
     id bigserial primary key,
     email text not null unique,
     google_sub text unique,
     name text,
     image text,
     consent_at timestamptz,
     photo_consent_at timestamptz,
     created_at timestamptz not null default now(),
     last_seen_at timestamptz not null default now())`,
  `create table if not exists profiles (
     id bigserial primary key,
     user_id bigint not null references users(id) on delete cascade,
     name text not null,
     input jsonb not null,
     created_at timestamptz not null default now(),
     updated_at timestamptz not null default now())`,
  `create index if not exists profiles_user_idx on profiles (user_id)`,
  `create table if not exists weights (
     id bigserial primary key,
     profile_id bigint not null references profiles(id) on delete cascade,
     kg real not null,
     created_at timestamptz not null default now())`,
  `create index if not exists weights_profile_idx on weights (profile_id, created_at)`,
  `create table if not exists food_logs (
     id bigserial primary key,
     profile_id bigint not null references profiles(id) on delete cascade,
     log_date date not null,
     meal text not null,
     food_id text not null,
     amount real not null,
     fried boolean not null default false,
     sweet smallint,
     kcal real not null, protein real not null, carb real not null, fat real not null,
     fiber real not null, sugar real not null default 0,
     created_at timestamptz not null default now())`,
  `create index if not exists food_logs_profile_idx on food_logs (profile_id, log_date)`,
  `create table if not exists user_foods (
     id bigserial primary key,
     user_id bigint not null references users(id) on delete cascade,
     name text not null,
     unit text not null,
     kcal real not null, protein real not null, carb real not null, fat real not null, fiber real not null,
     created_at timestamptz not null default now())`,
  `create table if not exists favorites (
     user_id bigint not null references users(id) on delete cascade,
     food_id text not null,
     created_at timestamptz not null default now(),
     primary key (user_id, food_id))`,

  // 3 — fase beta: analitik, masukan, sampel foto
  `create table if not exists events (
     id bigserial primary key,
     user_id bigint references users(id) on delete cascade,
     name text not null,
     props jsonb,
     created_at timestamptz not null default now())`,
  `create index if not exists events_user_idx on events (user_id, created_at)`,
  `create index if not exists events_name_idx on events (name, created_at)`,
  `create table if not exists feedback (
     id bigserial primary key,
     user_id bigint references users(id) on delete cascade,
     text text not null,
     page text,
     created_at timestamptz not null default now())`,
  `create table if not exists photo_samples (
     id bigserial primary key,
     user_id bigint not null references users(id) on delete cascade,
     profile_id bigint references profiles(id) on delete cascade,
     blob_url text not null,
     log_date date not null,
     meal text not null,
     items jsonb not null,
     created_at timestamptz not null default now())`,
];

let ready: Promise<void> | null = null;

export function ensureSchema() {
  if (!ready) {
    ready = (async () => {
      const run = getRunner();
      await run(`create table if not exists schema_migrations (n int primary key, at timestamptz not null default now())`, []);
      const done = new Set((await run(`select n from schema_migrations`, [])).map((r) => Number(r.n)));
      for (let i = 0; i < MIGRATIONS.length; i++) {
        if (done.has(i + 1)) continue;
        await run(MIGRATIONS[i], []);
        await run(`insert into schema_migrations (n) values ($1) on conflict do nothing`, [i + 1]);
      }
    })().catch((e) => {
      ready = null;
      throw e;
    });
  }
  return ready;
}

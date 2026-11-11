import { sql } from "@/lib/db";
import { track } from "./events";

export async function upsertUser(u: { email: string; googleSub: string | null; name: string | null; image: string | null }) {
  const email = u.email.trim().toLowerCase();
  const rows = await sql<{ id: string; inserted: boolean }>`
    insert into users (email, google_sub, name, image)
    values (${email}, ${u.googleSub}, ${u.name}, ${u.image})
    on conflict (email) do update set
      google_sub = coalesce(users.google_sub, excluded.google_sub),
      name = coalesce(excluded.name, users.name),
      image = coalesce(excluded.image, users.image),
      last_seen_at = now()
    returning id, (xmax = 0) as inserted`;
  const id = Number(rows[0].id);
  if (rows[0].inserted) await track(id, "signup");
  return id;
}

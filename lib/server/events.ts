import { sql } from "@/lib/db";

/** Catat kejadian untuk analitik retensi. Tidak pernah membuat request gagal. */
export async function track(userId: number | null, name: string, props?: Record<string, unknown>) {
  try {
    await sql`insert into events (user_id, name, props) values (${userId}, ${name}, ${props ? JSON.stringify(props) : null}::jsonb)`;
  } catch (e) {
    console.error("track", name, e);
  }
}

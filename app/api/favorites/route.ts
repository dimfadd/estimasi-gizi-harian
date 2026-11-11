import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { api, HttpError, readJson, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const GET = api(async () => {
  const uid = await requireUser();
  const rows = await sql<{ food_id: string }>`select food_id from favorites where user_id = ${uid} order by created_at`;
  return NextResponse.json({ favorites: rows.map((r) => r.food_id) });
});

export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const b = await readJson(req);
  const foodId = String(b.foodId ?? "").slice(0, 40);
  if (!/^(u:\d+|[a-z0-9_]+)$/.test(foodId)) throw new HttpError(400, "Makanan tidak valid");
  if (b.on === false) await sql`delete from favorites where user_id = ${uid} and food_id = ${foodId}`;
  else await sql`insert into favorites (user_id, food_id) values (${uid}, ${foodId}) on conflict do nothing`;
  return NextResponse.json({ ok: true });
});

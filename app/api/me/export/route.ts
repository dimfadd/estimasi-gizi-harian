import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { api, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Semua data milik pengguna dalam satu file JSON (hak akses data pribadi). */
export const GET = api(async () => {
  const uid = await requireUser();
  const [user] = await sql`select email, name, consent_at, photo_consent_at, created_at from users where id = ${uid}`;
  const profiles = await sql`select id, name, input, created_at, updated_at from profiles where user_id = ${uid} order by id`;
  const weights = await sql`
    select w.profile_id, w.kg, w.created_at from weights w join profiles p on p.id = w.profile_id
    where p.user_id = ${uid} order by w.created_at`;
  const logs = await sql`
    select l.profile_id, to_char(l.log_date, 'YYYY-MM-DD') as date, l.meal, l.food_id, l.amount, l.fried, l.sweet,
           l.kcal, l.protein, l.carb, l.fat, l.fiber, l.sugar, l.created_at
    from food_logs l join profiles p on p.id = l.profile_id where p.user_id = ${uid} order by l.log_date, l.id`;
  const foods = await sql`select id, name, unit, kcal, protein, carb, fat, fiber from user_foods where user_id = ${uid}`;
  const favorites = await sql`select food_id from favorites where user_id = ${uid}`;
  const samples = await sql`select blob_url, log_date, meal, items, created_at from photo_samples where user_id = ${uid}`;
  const body = JSON.stringify({ exported_at: new Date().toISOString(), user, profiles, weights, logs, foods, favorites, samples }, null, 2);
  return new NextResponse(body, {
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="sekepal-data.json"`,
    },
  });
});

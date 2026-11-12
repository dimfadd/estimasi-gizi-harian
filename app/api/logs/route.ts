import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { nutrientsOf, type Sweet } from "@/lib/log";
import { handScaleOf } from "@/lib/nutrition";
import { track } from "@/lib/server/events";
import { resolveFood } from "@/lib/server/foods";
import { profileInput } from "@/lib/server/profiles";
import { api, HttpError, readJson, requireProfile, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEALS = ["sarapan", "siang", "malam", "camilan"];

export const GET = api(async (req: Request) => {
  const uid = await requireUser();
  const q = new URL(req.url).searchParams;
  const pid = await requireProfile(uid, q.get("profile"));
  const from = q.get("from") ?? "";
  const to = q.get("to") ?? "";
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) throw new HttpError(400, "Tanggal tidak valid");
  const logs = await sql`
    select id, to_char(log_date, 'YYYY-MM-DD') as date, meal, food_id, amount, fried, sweet,
           kcal, protein as p, carb as c, fat as f, fiber as fb, sugar
    from food_logs where profile_id = ${pid} and log_date between ${from} and ${to}
    order by log_date, id limit 2000`;
  return NextResponse.json({ logs });
});

/** Tambah satu atau beberapa catatan sekaligus. Gizi dihitung ulang di server. */
export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const b = await readJson(req);
  const pid = await requireProfile(uid, b.profile);
  const date = String(b.date ?? "");
  const meal = String(b.meal ?? "");
  if (!DATE_RE.test(date) || !MEALS.includes(meal)) throw new HttpError(400, "Tanggal/waktu makan tidak valid");
  const items = Array.isArray(b.items) ? b.items : [];
  if (items.length === 0 || items.length > 20) throw new HttpError(400, "Tidak ada makanan");

  const input = await profileInput(uid, pid);
  const scale = handScaleOf(input.heightCm, input.sex);
  const out = [];
  for (const raw of items as Record<string, unknown>[]) {
    const food = await resolveFood(uid, String(raw.foodId ?? ""));
    const amount = Number(raw.amount);
    if (!(amount > 0 && amount <= 20)) throw new HttpError(400, "Jumlah tidak valid");
    const fried = raw.fried === true && food.fryable;
    const sweet = (food.sweetable && [0, 1, 2, 3].includes(Number(raw.sweet)) ? Number(raw.sweet) : 0) as Sweet;
    const n = nutrientsOf(food, amount, scale, fried, sweet)!;
    const [row] = await sql`
      insert into food_logs (profile_id, log_date, meal, food_id, amount, fried, sweet, kcal, protein, carb, fat, fiber, sugar)
      values (${pid}, ${date}, ${meal}, ${food.id}, ${amount}, ${fried}, ${food.sweetable ? sweet : null},
              ${n.kcal}, ${n.p}, ${n.c}, ${n.f}, ${n.fb}, ${n.sugar})
      returning id, to_char(log_date, 'YYYY-MM-DD') as date, meal, food_id, amount, fried, sweet,
                kcal, protein as p, carb as c, fat as f, fiber as fb, sugar`;
    out.push(row);
  }
  // draf dari foto: simpan versi akhir untuk mengukur seberapa jauh koreksi pengguna
  const draft = Number(b.photoDraft);
  if (Number.isInteger(draft) && draft > 0) {
    const final = (items as Record<string, unknown>[]).map((x) => ({ foodId: x.foodId, amount: x.amount, fried: x.fried, sweet: x.sweet }));
    await sql`update photo_ai set final_items = ${JSON.stringify(final)}::jsonb where id = ${draft} and user_id = ${uid}`;
  }
  await track(uid, "log_add", { n: out.length, via: typeof b.via === "string" ? b.via.slice(0, 20) : "manual" });
  return NextResponse.json({ logs: out }, { status: 201 });
});

export const DELETE = api(async (req: Request) => {
  const uid = await requireUser();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) throw new HttpError(400, "id tidak valid");
  await sql`
    delete from food_logs l using profiles p
    where l.id = ${id} and l.profile_id = p.id and p.user_id = ${uid}`;
  return NextResponse.json({ ok: true });
});

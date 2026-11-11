import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { track } from "@/lib/server/events";
import { api, HttpError, readJson, requireProfile, requireUser } from "@/lib/server/session";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEALS = ["sarapan", "siang", "malam", "camilan"];

/** Salin catatan dari tanggal lain (mis. kemarin), satu waktu makan atau sehari penuh. */
export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const b = await readJson(req);
  const pid = await requireProfile(uid, b.profile);
  const from = String(b.from ?? "");
  const to = String(b.to ?? "");
  const meal = b.meal == null ? null : String(b.meal);
  if (!DATE_RE.test(from) || !DATE_RE.test(to) || (meal && !MEALS.includes(meal))) throw new HttpError(400, "Parameter tidak valid");
  const logs = await sql`
    insert into food_logs (profile_id, log_date, meal, food_id, amount, fried, sweet, kcal, protein, carb, fat, fiber, sugar)
    select profile_id, ${to}::date, meal, food_id, amount, fried, sweet, kcal, protein, carb, fat, fiber, sugar
    from food_logs where profile_id = ${pid} and log_date = ${from}::date and (${meal}::text is null or meal = ${meal})
    order by id
    returning id, to_char(log_date, 'YYYY-MM-DD') as date, meal, food_id, amount, fried, sweet,
              kcal, protein as p, carb as c, fat as f, fiber as fb, sugar`;
  if (logs.length) await track(uid, "log_add", { n: logs.length, via: "copy" });
  return NextResponse.json({ logs }, { status: 201 });
});

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { LEGACY_IDS } from "@/lib/log";
import { sanitizeInput } from "@/lib/nutrition";
import { track } from "@/lib/server/events";
import { api, HttpError, readJson, requireUser } from "@/lib/server/session";

const CODE_RE = /^[a-z0-9-]{4,32}$/;

/**
 * Pindahkan data versi lama (kode keluarga) ke akun ini. Datanya DIPINDAH, bukan
 * disalin: setelah diklaim, kode lama tidak bisa dipakai lagi untuk melihat data.
 */
export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const code = String((await readJson(req)).code ?? "").trim().toLowerCase();
  if (!CODE_RE.test(code)) throw new HttpError(400, "Kode keluarga tidak valid");

  const entries = await sql<{ member_name: string; input: unknown; created_at: string }>`
    select member_name, input, created_at from sekepal_entries where family_code = ${code} order by created_at`;
  if (entries.length === 0) throw new HttpError(404, "Tidak ada data dengan kode itu (atau sudah diklaim)");

  const byMember = new Map<string, typeof entries>();
  for (const e of entries) {
    const k = e.member_name.trim().toLowerCase();
    byMember.set(k, [...(byMember.get(k) ?? []), e]);
  }

  const existing = await sql<{ id: string; name: string }>`select id, name from profiles where user_id = ${uid}`;
  let profiles = 0,
    logs = 0;
  for (const [key, list] of byMember) {
    const latest = sanitizeInput(list[list.length - 1].input);
    if (!latest) continue;
    let pid = existing.find((p) => p.name.trim().toLowerCase() === key)?.id;
    if (!pid) {
      const [p] = await sql<{ id: string }>`
        insert into profiles (user_id, name, input) values (${uid}, ${latest.name}, ${JSON.stringify(latest)}::jsonb) returning id`;
      pid = p.id;
      profiles++;
    }
    for (const e of list) {
      const inp = sanitizeInput(e.input);
      if (inp) await sql`insert into weights (profile_id, kg, created_at) values (${pid}, ${inp.weightKg}, ${e.created_at})`;
    }
    const old = await sql<Record<string, unknown>>`
      select log_date, meal, food_id, amount, fried, sweet, kcal, protein, carb, fat, fiber, created_at
      from sekepal_logs where family_code = ${code} and member_key = ${key}`;
    for (const l of old) {
      const legacy = LEGACY_IDS[String(l.food_id)];
      await sql`
        insert into food_logs (profile_id, log_date, meal, food_id, amount, fried, sweet, kcal, protein, carb, fat, fiber, created_at)
        values (${pid}, ${l.log_date}, ${l.meal}, ${legacy?.id ?? l.food_id}, ${l.amount}, ${l.fried}, ${legacy?.sweet ?? l.sweet},
                ${l.kcal}, ${l.protein}, ${l.carb}, ${l.fat}, ${l.fiber}, ${l.created_at})`;
      logs++;
    }
  }
  await sql`delete from sekepal_logs where family_code = ${code}`;
  await sql`delete from sekepal_entries where family_code = ${code}`;
  await track(uid, "claim", { profiles, logs });
  return NextResponse.json({ ok: true, profiles, logs });
});

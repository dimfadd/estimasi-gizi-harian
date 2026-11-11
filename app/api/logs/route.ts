import { NextResponse } from "next/server";
import { dbEnabled, ensureSchema, sql } from "@/lib/db";
import { LOG_BY_ID, nutrientsOf, type Sweet } from "@/lib/log";
import { handScaleOf } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

const CODE_RE = /^[a-z0-9-]{4,32}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEALS = ["sarapan", "siang", "malam", "camilan"];

const code = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");
const member = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase().slice(0, 40) : "");
const bad = (msg: string, status = 400) => NextResponse.json({ error: msg }, { status });
const off = () => bad("Database belum disambungkan. Catatan disimpan di browser ini saja.", 503);

export async function GET(req: Request) {
  if (!dbEnabled) return off();
  const q = new URL(req.url).searchParams;
  const fam = code(q.get("family"));
  const who = member(q.get("member"));
  const from = q.get("from") ?? "";
  const to = q.get("to") ?? "";
  if (!CODE_RE.test(fam) || !who || !DATE_RE.test(from) || !DATE_RE.test(to)) return bad("Parameter tidak valid");
  try {
    await ensureSchema();
    const rows = await sql()`
      select id, to_char(log_date, 'YYYY-MM-DD') as date, meal, food_id, amount, fried, sweet,
             kcal, protein as p, carb as c, fat as f, fiber as fb
      from sekepal_logs
      where family_code = ${fam} and member_key = ${who} and log_date between ${from} and ${to}
      order by log_date, created_at`;
    return NextResponse.json({ logs: rows });
  } catch (e) {
    console.error(e);
    return bad("Gagal membaca catatan", 500);
  }
}

export async function POST(req: Request) {
  if (!dbEnabled) return off();
  let b: Record<string, unknown>;
  try {
    b = await req.json();
  } catch {
    return bad("Body bukan JSON");
  }
  const fam = code(b.familyCode);
  const who = member(b.member);
  const date = String(b.date ?? "");
  const meal = String(b.meal ?? "");
  const foodId = String(b.foodId ?? "");
  const amount = Number(b.amount);
  const fried = b.fried === true;
  const sweetRaw = Number(b.sweet);
  const sweet = ([0, 1, 2, 3].includes(sweetRaw) ? sweetRaw : 0) as Sweet;
  const heightCm = Number(b.heightCm);
  const sex = b.sex === "wanita" ? "wanita" : "pria";
  if (!CODE_RE.test(fam)) return bad("Kode keluarga tidak valid");
  if (!who) return bad("Nama belum diisi");
  if (!DATE_RE.test(date) || !MEALS.includes(meal) || !LOG_BY_ID[foodId]) return bad("Data makanan tidak valid");
  if (!(amount > 0 && amount <= 20) || !(heightCm >= 120 && heightCm <= 220)) return bad("Jumlah tidak valid");

  // gizi dihitung ulang di server
  const n = nutrientsOf(foodId, amount, handScaleOf(heightCm, sex), fried, sweet)!;
  try {
    await ensureSchema();
    const rows = await sql()`
      insert into sekepal_logs (family_code, member_key, log_date, meal, food_id, amount, fried, sweet, kcal, protein, carb, fat, fiber)
      values (${fam}, ${who}, ${date}, ${meal}, ${foodId}, ${amount}, ${fried}, ${LOG_BY_ID[foodId].sweetable ? sweet : null}, ${n.kcal}, ${n.p}, ${n.c}, ${n.f}, ${n.fb})
      returning id, to_char(log_date, 'YYYY-MM-DD') as date, meal, food_id, amount, fried, sweet,
                kcal, protein as p, carb as c, fat as f, fiber as fb`;
    return NextResponse.json({ log: rows[0] }, { status: 201 });
  } catch (e) {
    console.error(e);
    return bad("Gagal menyimpan catatan", 500);
  }
}

export async function DELETE(req: Request) {
  if (!dbEnabled) return off();
  const q = new URL(req.url).searchParams;
  const fam = code(q.get("family"));
  const id = Number(q.get("id"));
  if (!CODE_RE.test(fam) || !Number.isInteger(id)) return bad("Parameter tidak valid");
  try {
    await ensureSchema();
    await sql()`delete from sekepal_logs where id = ${id} and family_code = ${fam}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return bad("Gagal menghapus", 500);
  }
}

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { track } from "@/lib/server/events";
import { api, HttpError, readJson, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const UNITS = ["porsi", "piring", "mangkuk", "potong", "buah", "butir", "biji", "bungkus", "gelas", "sdm", "kepal", "telapak"];

export const GET = api(async () => {
  const uid = await requireUser();
  const foods = await sql`select id, name, unit, kcal, protein, carb, fat, fiber from user_foods where user_id = ${uid} order by name`;
  return NextResponse.json({ foods });
});

export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const b = await readJson(req);
  const name = String(b.name ?? "").trim().slice(0, 60);
  const unit = String(b.unit ?? "");
  const num = (v: unknown, max: number) => {
    const n = Number(v ?? 0);
    if (!Number.isFinite(n) || n < 0 || n > max) throw new HttpError(400, "Angka gizi tidak valid");
    return n;
  };
  if (name.length < 2) throw new HttpError(400, "Nama makanan terlalu pendek");
  if (!UNITS.includes(unit)) throw new HttpError(400, "Satuan tidak valid");
  const kcal = num(b.kcal, 3000);
  if (kcal === 0) throw new HttpError(400, "Isi perkiraan kalori");
  const [{ n }] = await sql<{ n: string }>`select count(*) as n from user_foods where user_id = ${uid}`;
  if (Number(n) >= 200) throw new HttpError(400, "Maksimal 200 makanan buatan");
  const [food] = await sql`
    insert into user_foods (user_id, name, unit, kcal, protein, carb, fat, fiber)
    values (${uid}, ${name}, ${unit}, ${kcal}, ${num(b.protein, 300)}, ${num(b.carb, 500)}, ${num(b.fat, 300)}, ${num(b.fiber, 100)})
    returning id, name, unit, kcal, protein, carb, fat, fiber`;
  await track(uid, "custom_food");
  return NextResponse.json({ food }, { status: 201 });
});

export const DELETE = api(async (req: Request) => {
  const uid = await requireUser();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) throw new HttpError(400, "id tidak valid");
  await sql`delete from user_foods where id = ${id} and user_id = ${uid}`;
  return NextResponse.json({ ok: true });
});

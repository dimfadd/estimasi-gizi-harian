import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { sql } from "@/lib/db";
import { track } from "@/lib/server/events";
import { api, HttpError, requireProfile, requireUser } from "@/lib/server/session";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MEALS = ["sarapan", "siang", "malam", "camilan"];
const MAX_BYTES = 3 * 1024 * 1024;

/**
 * Fase beta: kumpulkan foto piring + catatan yang sudah dikonfirmasi pengguna,
 * untuk menguji akurasi fitur foto sebelum dibuat. Hanya dengan persetujuan foto.
 */
export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError(503, "Penyimpanan foto belum disambungkan");
  const [u] = await sql<{ photo_consent_at: string | null }>`select photo_consent_at from users where id = ${uid}`;
  if (!u?.photo_consent_at) throw new HttpError(403, "Setujui dulu pemakaian foto");

  const form = await req.formData();
  const pid = await requireProfile(uid, form.get("profile"));
  const date = String(form.get("date") ?? "");
  const meal = String(form.get("meal") ?? "");
  const photo = form.get("photo");
  if (!DATE_RE.test(date) || !MEALS.includes(meal)) throw new HttpError(400, "Parameter tidak valid");
  if (!(photo instanceof File) || !["image/jpeg", "image/webp"].includes(photo.type) || photo.size > MAX_BYTES)
    throw new HttpError(400, "Foto harus JPG/WebP maksimal 3 MB");

  const items = await sql`
    select food_id, amount, fried, sweet, kcal from food_logs
    where profile_id = ${pid} and log_date = ${date} and meal = ${meal} and food_id <> 'air' order by id`;
  if (items.length === 0) throw new HttpError(400, "Catat dulu isi piringnya, baru kirim fotonya");

  const [{ n }] = await sql<{ n: string }>`
    select count(*) as n from photo_samples where user_id = ${uid} and created_at > now() - interval '1 day'`;
  if (Number(n) >= 10) throw new HttpError(429, "Maksimal 10 foto per hari. Terima kasih!");

  const blob = await put(`samples/${uid}/${date}-${meal}.jpg`, photo, {
    access: "public",
    addRandomSuffix: true,
    contentType: photo.type,
  });
  await sql`
    insert into photo_samples (user_id, profile_id, blob_url, log_date, meal, items)
    values (${uid}, ${pid}, ${blob.url}, ${date}, ${meal}, ${JSON.stringify(items)}::jsonb)`;
  await track(uid, "photo_sample");
  return NextResponse.json({ ok: true }, { status: 201 });
});

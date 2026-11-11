import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { api, HttpError, readJson, requireUser } from "@/lib/server/session";

export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const b = await readJson(req);
  const text = String(b.text ?? "").trim().slice(0, 2000);
  if (text.length < 3) throw new HttpError(400, "Tulis masukannya dulu");
  const [{ n }] = await sql<{ n: string }>`
    select count(*) as n from feedback where user_id = ${uid} and created_at > now() - interval '1 day'`;
  if (Number(n) >= 10) throw new HttpError(429, "Terima kasih! Batas masukan hari ini sudah tercapai.");
  await sql`insert into feedback (user_id, text, page) values (${uid}, ${text}, ${String(b.page ?? "").slice(0, 40)})`;
  return NextResponse.json({ ok: true }, { status: 201 });
});

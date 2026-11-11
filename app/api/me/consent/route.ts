import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { track } from "@/lib/server/events";
import { api, readJson, requireUser } from "@/lib/server/session";

export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const b = await readJson(req);
  if (b.photo === true) {
    await sql`update users set photo_consent_at = coalesce(photo_consent_at, now()) where id = ${uid}`;
  } else if (b.photo === false) {
    await sql`update users set photo_consent_at = null where id = ${uid}`;
  } else {
    await sql`update users set consent_at = coalesce(consent_at, now()) where id = ${uid}`;
    await track(uid, "consent");
  }
  return NextResponse.json({ ok: true });
});

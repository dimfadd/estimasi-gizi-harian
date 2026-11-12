import { NextResponse } from "next/server";
import { del } from "@vercel/blob";
import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { proStatus } from "@/lib/server/pro";
import { listProfiles } from "@/lib/server/profiles";
import { api, isAdminEmail, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const GET = api(async () => {
  const uid = await requireUser();
  const s = await auth();
  const [user] = await sql<{ email: string; name: string | null; image: string | null; consent_at: string | null; photo_consent_at: string | null }>`
    update users set last_seen_at = now() where id = ${uid}
    returning email, name, image, consent_at, photo_consent_at`;
  if (!user) return NextResponse.json({ error: "Akun tidak ditemukan" }, { status: 401 });
  const profiles = await listProfiles(uid);
  const pro = await proStatus(uid);
  return NextResponse.json({
    user: { ...user, admin: isAdminEmail(s?.user?.email), pro: pro.pro, pro_until: pro.until },
    profiles,
    features: { samples: Boolean(process.env.BLOB_READ_WRITE_TOKEN), photoAi: Boolean(process.env.ANTHROPIC_API_KEY) },
  });
});

/** Hapus akun beserta semua datanya (profil, catatan, foto sampel). */
export const DELETE = api(async () => {
  const uid = await requireUser();
  const photos = await sql<{ blob_url: string }>`select blob_url from photo_samples where user_id = ${uid}`;
  if (photos.length && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(photos.map((p) => p.blob_url));
    } catch (e) {
      console.error("hapus foto", e);
    }
  }
  await sql`delete from users where id = ${uid}`;
  return NextResponse.json({ ok: true });
});

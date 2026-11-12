import { NextResponse } from "next/server";
import { cardioKcal, CARDIO_BY_ID, restKcal, strengthKcal, strengthMinutes, type Intensity, type SetEntry } from "@/lib/activity";
import { sql } from "@/lib/db";
import { EXERCISE_BY_ID } from "@/lib/exercises";
import { track } from "@/lib/server/events";
import { requirePro } from "@/lib/server/pro";
import { profileInput } from "@/lib/server/profiles";
import { api, HttpError, readJson, requireProfile, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const INTENSITIES: Intensity[] = ["santai", "sedang", "berat"];

export const GET = api(async (req: Request) => {
  const uid = await requireUser();
  const q = new URL(req.url).searchParams;
  const pid = await requireProfile(uid, q.get("profile"));
  const from = q.get("from") ?? "";
  const to = q.get("to") ?? "";
  if (!DATE_RE.test(from) || !DATE_RE.test(to)) throw new HttpError(400, "Tanggal tidak valid");
  const activities = await sql`
    select id, to_char(log_date, 'YYYY-MM-DD') as date, kind, activity_id, sets, minutes, km, intensity, kcal, rest_kcal
    from activities where profile_id = ${pid} and log_date between ${from} and ${to} order by log_date, id limit 1000`;
  return NextResponse.json({ activities });
});

/** Catat latihan beban (kind "gym", berisi set) atau olahraga lain (kind "cardio"). Kalori dihitung di server. */
export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  await requirePro(uid);
  const b = await readJson(req);
  const pid = await requireProfile(uid, b.profile);
  const date = String(b.date ?? "");
  if (!DATE_RE.test(date)) throw new HttpError(400, "Tanggal tidak valid");
  const { weightKg } = await profileInput(uid, pid);
  const kind = String(b.kind ?? "");
  const id = String(b.activityId ?? "");

  let sets: SetEntry[] | null = null;
  let minutes = 0;
  let km: number | null = null;
  let intensity: Intensity | null = null;
  let kcal = 0;

  if (kind === "gym") {
    const ex = EXERCISE_BY_ID[id];
    if (!ex) throw new HttpError(400, "Gerakan tidak dikenal");
    const raw = Array.isArray(b.sets) ? b.sets : [];
    sets = raw.slice(0, 20).map((x: Record<string, unknown>) => ({
      kg: Math.max(0, Math.min(500, Number(x.kg) || 0)),
      reps: Math.max(0, Math.min(ex.unit === "detik" ? 1800 : 200, Math.round(Number(x.reps) || 0))),
    }));
    sets = sets.filter((x) => x.reps > 0);
    if (sets.length === 0) throw new HttpError(400, "Isi minimal satu set");
    minutes = strengthMinutes(sets);
    kcal = strengthKcal(sets, weightKg);
  } else if (kind === "cardio") {
    if (!CARDIO_BY_ID[id]) throw new HttpError(400, "Aktivitas tidak dikenal");
    minutes = Number(b.minutes);
    if (!(minutes > 0 && minutes <= 600)) throw new HttpError(400, "Durasi 1–600 menit");
    km = b.km == null || b.km === "" ? null : Number(b.km);
    if (km != null && !(km > 0 && km <= 300)) throw new HttpError(400, "Jarak tidak valid");
    intensity = INTENSITIES.includes(b.intensity as Intensity) ? (b.intensity as Intensity) : "sedang";
    kcal = cardioKcal({ activityId: id, minutes, km: km ?? undefined, intensity }, weightKg);
  } else throw new HttpError(400, "Jenis aktivitas tidak valid");

  const rest = Math.round(restKcal(minutes, weightKg));
  const [row] = await sql`
    insert into activities (profile_id, log_date, kind, activity_id, sets, minutes, km, intensity, kcal, rest_kcal)
    values (${pid}, ${date}, ${kind}, ${id}, ${sets ? JSON.stringify(sets) : null}::jsonb, ${minutes}, ${km}, ${intensity}, ${kcal}, ${rest})
    returning id, to_char(log_date, 'YYYY-MM-DD') as date, kind, activity_id, sets, minutes, km, intensity, kcal, rest_kcal`;
  await track(uid, "activity_add", { kind, id });
  return NextResponse.json({ activity: row }, { status: 201 });
});

export const DELETE = api(async (req: Request) => {
  const uid = await requireUser();
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) throw new HttpError(400, "id tidak valid");
  await sql`delete from activities a using profiles p where a.id = ${id} and a.profile_id = p.id and p.user_id = ${uid}`;
  return NextResponse.json({ ok: true });
});

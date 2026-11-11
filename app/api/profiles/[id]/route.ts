import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { track } from "@/lib/server/events";
import { cleanInput, profileInput } from "@/lib/server/profiles";
import { api, readJson, requireProfile, requireUser } from "@/lib/server/session";

type Ctx = { params: Promise<{ id: string }> };

/** Ubah data diri. Kalau beratnya berubah, berat baru masuk ke riwayat. */
export const PATCH = api(async (req: Request, ctx: Ctx) => {
  const uid = await requireUser();
  const pid = await requireProfile(uid, (await ctx.params).id);
  const input = cleanInput((await readJson(req)).input);
  const before = await profileInput(uid, pid);
  const [profile] = await sql`
    update profiles set name = ${input.name}, input = ${JSON.stringify(input)}::jsonb, updated_at = now()
    where id = ${pid} and user_id = ${uid}
    returning id, name, input, created_at, updated_at`;
  if (before.weightKg !== input.weightKg) {
    await sql`insert into weights (profile_id, kg) values (${pid}, ${input.weightKg})`;
    await track(uid, "weight_add");
  }
  return NextResponse.json({ profile });
});

export const DELETE = api(async (_req: Request, ctx: Ctx) => {
  const uid = await requireUser();
  const pid = await requireProfile(uid, (await ctx.params).id);
  await sql`delete from profiles where id = ${pid} and user_id = ${uid}`;
  return NextResponse.json({ ok: true });
});

import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { track } from "@/lib/server/events";
import { cleanInput } from "@/lib/server/profiles";
import { api, readJson, requireUser } from "@/lib/server/session";

const MAX_PROFILES = 10;

export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const b = await readJson(req);
  const input = cleanInput(b.input);
  const [{ n }] = await sql<{ n: string }>`select count(*) as n from profiles where user_id = ${uid}`;
  if (Number(n) >= MAX_PROFILES) return NextResponse.json({ error: `Maksimal ${MAX_PROFILES} profil per akun` }, { status: 400 });
  const [profile] = await sql`
    insert into profiles (user_id, name, input) values (${uid}, ${input.name}, ${JSON.stringify(input)}::jsonb)
    returning id, name, input, created_at, updated_at`;
  await sql`insert into weights (profile_id, kg) values (${profile.id}, ${input.weightKg})`;
  await track(uid, "profile_create", { goal: input.goal, sex: input.sex, age: input.age });
  return NextResponse.json({ profile }, { status: 201 });
});

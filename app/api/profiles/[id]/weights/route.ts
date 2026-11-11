import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { api, requireProfile, requireUser } from "@/lib/server/session";

type Ctx = { params: Promise<{ id: string }> };

export const dynamic = "force-dynamic";

export const GET = api(async (_req: Request, ctx: Ctx) => {
  const uid = await requireUser();
  const pid = await requireProfile(uid, (await ctx.params).id);
  const weights = await sql`select id, kg, created_at from weights where profile_id = ${pid} order by created_at limit 500`;
  return NextResponse.json({ weights });
});

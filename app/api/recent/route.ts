import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { api, requireProfile, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

/** Makanan yang paling sering & paling baru dicatat 30 hari terakhir, dengan jumlah terakhirnya. */
export const GET = api(async (req: Request) => {
  const uid = await requireUser();
  const pid = await requireProfile(uid, new URL(req.url).searchParams.get("profile"));
  const recent = await sql`
    select food_id, count(*)::int as n, max(created_at) as last,
           (array_agg(amount order by created_at desc))[1] as amount,
           (array_agg(sweet order by created_at desc))[1] as sweet,
           (array_agg(fried order by created_at desc))[1] as fried
    from food_logs
    where profile_id = ${pid} and created_at > now() - interval '30 days' and food_id <> 'air'
    group by food_id
    order by count(*) desc, max(created_at) desc
    limit 16`;
  return NextResponse.json({ recent });
});

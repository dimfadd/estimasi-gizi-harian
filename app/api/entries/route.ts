import { NextResponse } from "next/server";
import { dbEnabled, ensureSchema, sql } from "@/lib/db";
import { buildPlan, sanitizeInput } from "@/lib/nutrition";

export const dynamic = "force-dynamic";

const CODE_RE = /^[a-z0-9-]{4,32}$/;
const normCode = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : "");

function off() {
  return NextResponse.json({ error: "Database belum disambungkan. Data disimpan di browser ini saja." }, { status: 503 });
}

function summary(plan: ReturnType<typeof buildPlan>) {
  return {
    targetKcal: plan.targetKcal,
    tdee: plan.tdee,
    proteinG: plan.proteinG,
    fatG: plan.fatG,
    carbG: plan.carbG,
    bmi: Number(plan.bmi.toFixed(1)),
    targetWeightKg: plan.targetWeightKg,
    weeksToGoal: plan.weeksToGoal,
    daily: plan.daily,
  };
}

export async function GET(req: Request) {
  if (!dbEnabled) return off();
  const code = normCode(new URL(req.url).searchParams.get("family"));
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "Kode keluarga tidak valid" }, { status: 400 });
  try {
    await ensureSchema();
    const rows = await sql()`
      select id, member_name, input, output, created_at
      from sekepal_entries where family_code = ${code}
      order by created_at desc limit 300`;
    return NextResponse.json({ entries: rows });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal membaca database" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!dbEnabled) return off();
  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body bukan JSON" }, { status: 400 });
  }
  const code = normCode(body.familyCode);
  if (!CODE_RE.test(code)) return NextResponse.json({ error: "Kode keluarga 4–32 huruf kecil/angka/strip" }, { status: 400 });
  const input = sanitizeInput(body.input);
  if (!input || !input.name) return NextResponse.json({ error: "Data diri belum lengkap" }, { status: 400 });

  // Hasil dihitung ulang di server, tidak mempercayai angka dari browser.
  const output = summary(buildPlan(input));
  try {
    await ensureSchema();
    const rows = await sql()`
      insert into sekepal_entries (family_code, member_name, input, output)
      values (${code}, ${input.name}, ${JSON.stringify(input)}::jsonb, ${JSON.stringify(output)}::jsonb)
      returning id, member_name, input, output, created_at`;
    return NextResponse.json({ entry: rows[0] }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menyimpan" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  if (!dbEnabled) return off();
  const params = new URL(req.url).searchParams;
  const code = normCode(params.get("family"));
  const id = Number(params.get("id"));
  if (!CODE_RE.test(code) || !Number.isInteger(id)) return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
  try {
    await ensureSchema();
    await sql()`delete from sekepal_entries where id = ${id} and family_code = ${code}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Gagal menghapus" }, { status: 500 });
  }
}

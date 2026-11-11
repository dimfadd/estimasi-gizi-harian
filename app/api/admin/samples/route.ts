import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { sampleExport } from "@/lib/server/stats";
import { api, HttpError, isAdminEmail, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";

export const GET = api(async () => {
  await requireUser();
  const s = await auth();
  if (!isAdminEmail(s?.user?.email)) throw new HttpError(404, "Tidak ditemukan");
  const rows = await sampleExport();
  return new NextResponse(JSON.stringify(rows, null, 2), {
    headers: { "content-type": "application/json", "content-disposition": `attachment; filename="sekepal-sampel-foto.json"` },
  });
});

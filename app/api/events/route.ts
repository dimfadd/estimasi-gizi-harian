import { NextResponse } from "next/server";
import { track } from "@/lib/server/events";
import { api, readJson, requireUser } from "@/lib/server/session";

// Hanya nama kejadian yang dikenal yang diterima dari browser.
const ALLOWED = new Set(["app_open", "search_miss", "tab_view", "install"]);

export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  const b = await readJson(req);
  const name = String(b.name ?? "");
  if (!ALLOWED.has(name)) return NextResponse.json({ ok: false }, { status: 400 });
  const props: Record<string, unknown> = {};
  if (typeof b.q === "string") props.q = b.q.trim().toLowerCase().slice(0, 60);
  if (typeof b.tab === "string") props.tab = b.tab.slice(0, 20);
  await track(uid, name, Object.keys(props).length ? props : undefined);
  return NextResponse.json({ ok: true });
});

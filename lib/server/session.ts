import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { dbEnabled, sql } from "@/lib/db";

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Id pengguna yang sedang login, atau lempar 401. */
export async function requireUser(): Promise<number> {
  if (!dbEnabled) throw new HttpError(503, "Database belum disambungkan");
  const s = await auth();
  const id = Number(s?.user?.id);
  if (!Number.isInteger(id) || id <= 0) throw new HttpError(401, "Silakan masuk dulu");
  return id;
}

/** Pastikan profil milik pengguna ini; kalau bukan, 404 (tidak membocorkan keberadaannya). */
export async function requireProfile(userId: number, profileId: unknown): Promise<number> {
  const pid = Number(profileId);
  if (!Number.isInteger(pid) || pid <= 0) throw new HttpError(400, "Profil tidak valid");
  const rows = await sql`select 1 from profiles where id = ${pid} and user_id = ${userId}`;
  if (rows.length === 0) throw new HttpError(404, "Profil tidak ditemukan");
  return pid;
}

export function isAdminEmail(email: string | null | undefined) {
  const list = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return Boolean(email) && list.includes(String(email).toLowerCase());
}

/** Bungkus handler API: ubah HttpError jadi respons JSON, error lain jadi 500. */
export function api<A extends unknown[]>(fn: (...args: A) => Promise<Response>) {
  return async (...args: A) => {
    try {
      return await fn(...args);
    } catch (e) {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: "Terjadi kesalahan di server" }, { status: 500 });
    }
  };
}

export async function readJson(req: Request): Promise<Record<string, unknown>> {
  try {
    const b = await req.json();
    return b && typeof b === "object" ? (b as Record<string, unknown>) : {};
  } catch {
    throw new HttpError(400, "Body bukan JSON");
  }
}

import { auth } from "@/auth";
import { sql } from "@/lib/db";
import { HttpError, isAdminEmail } from "./session";

const listed = (env: string | undefined, email: string) =>
  (env ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean)
    .includes(email.toLowerCase());

/** Pro kalau: pro_until masih berlaku, email ada di PRO_EMAILS, atau admin. */
export async function proStatus(userId: number) {
  const s = await auth();
  const email = String(s?.user?.email ?? "");
  const [u] = await sql<{ pro_until: string | null }>`select pro_until from users where id = ${userId}`;
  const until = u?.pro_until ? new Date(u.pro_until) : null;
  const pro = (until != null && until > new Date()) || listed(process.env.PRO_EMAILS, email) || isAdminEmail(email);
  return { pro, until: until?.toISOString() ?? null };
}

export async function requirePro(userId: number) {
  const { pro } = await proStatus(userId);
  if (!pro) throw new HttpError(402, "Fitur ini khusus Sekepal Pro");
}

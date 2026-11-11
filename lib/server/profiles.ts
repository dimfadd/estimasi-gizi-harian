import { sql } from "@/lib/db";
import { sanitizeInput, type PlanInput } from "@/lib/nutrition";
import { HttpError } from "./session";

export interface ProfileRow {
  id: string;
  name: string;
  input: PlanInput;
  created_at: string;
  updated_at: string;
}

export function cleanInput(raw: unknown): PlanInput {
  const input = sanitizeInput(raw);
  if (!input) throw new HttpError(400, "Data diri tidak valid");
  if (!input.name) throw new HttpError(400, "Nama panggilan wajib diisi");
  return input;
}

export async function listProfiles(userId: number) {
  return sql<ProfileRow>`
    select id, name, input, created_at, updated_at from profiles
    where user_id = ${userId} order by created_at`;
}

export async function profileInput(userId: number, profileId: number): Promise<PlanInput> {
  const rows = await sql<{ input: PlanInput }>`select input from profiles where id = ${profileId} and user_id = ${userId}`;
  if (!rows[0]) throw new HttpError(404, "Profil tidak ditemukan");
  return rows[0].input;
}

import { sql } from "@/lib/db";
import { customItem, LOG_BY_ID, type LogItem } from "@/lib/log";
import { HttpError } from "./session";

/** Cari item makanan: katalog, atau makanan buatan milik pengguna ini ("u:<id>"). */
export async function resolveFood(userId: number, foodId: string): Promise<LogItem> {
  if (foodId.startsWith("u:")) {
    const id = Number(foodId.slice(2));
    if (!Number.isInteger(id)) throw new HttpError(400, "Makanan tidak valid");
    const rows = await sql<{ id: string; name: string; unit: string; kcal: number; protein: number; carb: number; fat: number; fiber: number }>`
      select id, name, unit, kcal, protein, carb, fat, fiber from user_foods where id = ${id} and user_id = ${userId}`;
    if (!rows[0]) throw new HttpError(404, "Makanan tidak ditemukan");
    return customItem(rows[0]);
  }
  const it = LOG_BY_ID[foodId];
  if (!it) throw new HttpError(400, "Makanan tidak dikenal");
  return it;
}


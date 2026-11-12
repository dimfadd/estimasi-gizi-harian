import { LOG_BY_ID, nutrientsOf, type Sweet } from "./log.ts";

type Item = { foodId: string; amount: number; fried?: boolean; sweet?: number };

const kcalOf = (items: Item[]) =>
  items.reduce((s, it) => s + (nutrientsOf(LOG_BY_ID[it.foodId], Number(it.amount), 1, Boolean(it.fried), (it.sweet ?? 0) as Sweet)?.kcal ?? 0), 0);

/** Seberapa jauh draf AI dari catatan yang akhirnya disimpan pengguna. */
export function photoAccuracy(rows: { ai_items: { items: Item[] }; final_items: Item[] | null }[]) {
  const done = rows.filter((r) => r.final_items && r.final_items.length > 0);
  if (done.length === 0) return { confirmed: 0, unchanged: 0, mape: null as number | null, itemRecall: null as number | null };
  let unchanged = 0,
    errSum = 0,
    hit = 0,
    total = 0;
  for (const r of done) {
    const ai = r.ai_items.items ?? [];
    const fin = r.final_items!;
    const same = ai.length === fin.length && ai.every((a, i) => a.foodId === fin[i].foodId && Number(a.amount) === Number(fin[i].amount));
    if (same) unchanged++;
    const kf = kcalOf(fin);
    if (kf > 0) errSum += Math.abs(kcalOf(ai) - kf) / kf;
    const aiIds = new Set(ai.map((a) => a.foodId));
    for (const f of fin) {
      total++;
      if (aiIds.has(f.foodId)) hit++;
    }
  }
  return { confirmed: done.length, unchanged, mape: errSum / done.length, itemRecall: total ? hit / total : null };
}

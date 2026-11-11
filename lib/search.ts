import type { LogItem } from "./log.ts";

export function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** jarak edit, berhenti lebih awal kalau sudah melewati batas */
function within(a: string, b: string, max: number) {
  if (Math.abs(a.length - b.length) > max) return false;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let best = i;
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      best = Math.min(best, cur[j]);
    }
    if (best > max) return false;
    prev = cur;
  }
  return prev[b.length] <= max;
}

function tokenScore(tok: string, words: string[]) {
  let best = 0;
  for (const w of words) {
    if (w === tok) return 4;
    if (w.startsWith(tok)) best = Math.max(best, 3);
    else if (tok.length >= 3 && w.includes(tok)) best = Math.max(best, 2);
    else if (tok.length >= 4) {
      const max = tok.length >= 7 ? 2 : 1;
      // bandingkan juga dengan awalan kata sepanjang token (untuk yang belum selesai diketik)
      if (within(tok, w, max) || (w.length > tok.length && within(tok, w.slice(0, tok.length), 1))) best = Math.max(best, 1);
    }
  }
  return best;
}

/**
 * Cari makanan berdasarkan nama & nama lain. Toleran salah ketik ringan
 * ("kangkong" → kangkung) dan urutan kata bebas ("ayam bakar" = "bakar ayam").
 */
export function searchFoods(items: LogItem[], query: string, limit = 30): LogItem[] {
  const q = normalize(query);
  if (!q) return [];
  const toks = q.split(" ");
  const scored: { it: LogItem; s: number }[] = [];
  for (let idx = 0; idx < items.length; idx++) {
    const it = items[idx];
    const name = normalize(it.name);
    const words = `${name} ${normalize(it.aka)} ${it.id.replace(/_/g, " ")}`.split(" ");
    let s = 0;
    let ok = true;
    for (const t of toks) {
      const ts = tokenScore(t, words);
      if (ts === 0) {
        ok = false;
        break;
      }
      s += ts;
    }
    if (!ok) continue;
    if (name === q) s += 10;
    else if (name.startsWith(q)) s += 5;
    // skor sama → yang lebih umum (lebih awal di daftar) di atas
    s -= idx / 100000;
    scored.push({ it, s });
  }
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.it);
}

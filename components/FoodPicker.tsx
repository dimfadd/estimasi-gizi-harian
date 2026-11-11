"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GROUP_LABEL, type LogGroup } from "@/lib/fooddb";
import { DRINK_SIZES, SWEET_LEVELS, nutrientsOf, type LogItem, type Sweet } from "@/lib/log";
import { fmtAmount } from "@/lib/nutrition";
import { searchFoods } from "@/lib/search";
import { FoodIcon } from "./art";
import { Stepper } from "./Form";
import { n0, UnitIcon } from "./TrackerParts";

export interface Recent {
  food_id: string;
  amount: number;
  sweet: number | null;
  fried: boolean;
}

export type NewRow = { foodId: string; amount: number; fried: boolean; sweet?: Sweet };

type Tab = "terakhir" | "favorit" | LogGroup;

const CATS: LogGroup[] = ["karbo", "lauk", "sayur", "buah", "hidangan", "camilan", "minum", "bumbu", "buatanku"];
const CUSTOM_UNITS = ["porsi", "piring", "mangkuk", "potong", "buah", "butir", "biji", "bungkus", "gelas", "sdm", "kepal", "telapak"];

function CustomForm({ name0, onCancel, onCreate }: { name0: string; onCancel: () => void; onCreate: (f: Record<string, unknown>) => Promise<void> }) {
  const [f, setF] = useState({ name: name0, unit: "porsi", kcal: "", protein: "", carb: "", fat: "", fiber: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setF((s) => ({ ...s, [k]: e.target.value }));
  const num = (v: string) => Number(v.replace(",", ".") || 0);
  return (
    <form
      className="custom"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr("");
        try {
          await onCreate({ name: f.name, unit: f.unit, kcal: num(f.kcal), protein: num(f.protein), carb: num(f.carb), fat: num(f.fat), fiber: num(f.fiber) });
        } catch (x) {
          setErr(x instanceof Error ? x.message : "Gagal menyimpan");
          setBusy(false);
        }
      }}
    >
      <h4>Makanan buatanmu</h4>
      <p className="fine">Lihat label gizi di kemasan, atau perkiraan dari makanan yang mirip. Cukup kalori dan protein; sisanya boleh kosong.</p>
      <div className="custom-grid">
        <label className="wide">
          <span className="label">Nama</span>
          <input className="text-input" value={f.name} onChange={set("name")} maxLength={60} required />
        </label>
        <label>
          <span className="label">Per 1</span>
          <select className="text-input" value={f.unit} onChange={set("unit")}>
            {CUSTOM_UNITS.map((u) => (
              <option key={u}>{u}</option>
            ))}
          </select>
        </label>
        {(
          [
            ["kcal", "Kalori (kkal)"],
            ["protein", "Protein (g)"],
            ["carb", "Karbo (g)"],
            ["fat", "Lemak (g)"],
            ["fiber", "Serat (g)"],
          ] as const
        ).map(([k, l]) => (
          <label key={k}>
            <span className="label">{l}</span>
            <input className="text-input" inputMode="decimal" value={f[k]} onChange={set(k)} required={k === "kcal"} />
          </label>
        ))}
      </div>
      {err && <div className="status err">{err}</div>}
      <div className="custom-actions">
        <button type="submit" className="btn primary" disabled={busy}>
          {busy ? "Menyimpan…" : "Simpan makanan"}
        </button>
        <button type="button" className="btn ghost" onClick={onCancel}>
          Batal
        </button>
      </div>
    </form>
  );
}

export default function FoodPicker({
  items,
  recent,
  favorites,
  handScale,
  busy,
  slotLabel,
  onAdd,
  onToggleFav,
  onCreateCustom,
  onMiss,
}: {
  items: LogItem[];
  recent: Recent[];
  favorites: string[];
  handScale: number;
  busy: boolean;
  slotLabel: string;
  onAdd: (rows: NewRow[]) => Promise<boolean>;
  onToggleFav: (id: string, on: boolean) => void;
  onCreateCustom: (f: Record<string, unknown>) => Promise<LogItem>;
  onMiss: (q: string) => void;
}) {
  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<Tab>(recent.length ? "terakhir" : "karbo");
  const [selId, setSelId] = useState("");
  const [amount, setAmount] = useState(1);
  const [fried, setFried] = useState(false);
  const [sweet, setSweet] = useState<Sweet>(2);
  const [custom, setCustom] = useState<string | null>(null);
  const panel = useRef<HTMLDivElement>(null);
  const missed = useRef(new Set<string>());

  // kalau riwayat baru dimuat, buka tab Terakhir
  const hadRecent = useRef(recent.length > 0);
  useEffect(() => {
    if (!hadRecent.current && recent.length > 0) {
      hadRecent.current = true;
      setTab("terakhir");
    }
  }, [recent.length]);

  const results = useMemo(() => searchFoods(items, query, 40), [items, query]);

  // catat pencarian yang tidak menemukan apa-apa (sekali per kata, setelah berhenti mengetik)
  useEffect(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 3 || results.length > 0 || missed.current.has(q)) return;
    const t = setTimeout(() => {
      missed.current.add(q);
      onMiss(q);
    }, 1200);
    return () => clearTimeout(t);
  }, [query, results.length, onMiss]);

  const list: LogItem[] = query.trim()
    ? results
    : tab === "terakhir"
      ? recent.map((r) => byId[r.food_id]).filter(Boolean)
      : tab === "favorit"
        ? favorites.map((id) => byId[id]).filter(Boolean)
        : items.filter((i) => i.group === tab);

  const item = selId ? byId[selId] : undefined;
  const preview = item ? nutrientsOf(item, amount, handScale, fried, sweet) : null;
  const isFav = item ? favorites.includes(item.id) : false;

  const pick = (it: LogItem) => {
    setSelId(it.id);
    const r = recent.find((x) => x.food_id === it.id);
    setAmount(r ? Number(r.amount) : 1);
    setFried(r ? Boolean(r.fried) && it.fryable : false);
    if (it.sweetable) setSweet((r?.sweet ?? (it.id === "kopi" || it.id === "teh" ? 2 : it.id === "kemasan" ? 3 : 1)) as Sweet);
    setTimeout(() => panel.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 30);
  };

  const add = async () => {
    if (!item) return;
    const ok = await onAdd([{ foodId: item.id, amount, fried, sweet }]);
    if (ok) {
      setSelId("");
      setQuery("");
    }
  };

  return (
    <div className="picker">
      <div className="search">
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden>
          <circle cx="10.5" cy="10.5" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
          <path d="M15.5 15.5 21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={query}
          placeholder="Cari makanan: nasi, soto, es teh…"
          aria-label="Cari makanan"
          onChange={(e) => setQuery(e.target.value)}
          enterKeyHint="search"
        />
      </div>

      {!query.trim() && (
        <div className="tabs small cats" role="tablist">
          {recent.length > 0 && (
            <button role="tab" aria-selected={tab === "terakhir"} onClick={() => setTab("terakhir")}>
              Terakhir
            </button>
          )}
          <button role="tab" aria-selected={tab === "favorit"} onClick={() => setTab("favorit")}>
            Favorit
          </button>
          {CATS.map((c) => (
            <button key={c} role="tab" aria-selected={tab === c} onClick={() => setTab(c)}>
              {GROUP_LABEL[c]}
            </button>
          ))}
        </div>
      )}

      {list.length > 0 ? (
        <div className="food-grid">
          {list.map((i) => (
            <button key={i.id} type="button" className="food" aria-pressed={i.id === selId} onClick={() => pick(i)}>
              <FoodIcon id={i.icon} size={36} />
              <span>{i.name}</span>
              <small>per {i.unit}</small>
            </button>
          ))}
        </div>
      ) : (
        <div className="picker-empty">
          {query.trim() ? (
            <>
              <p>
                Belum ada <b>&ldquo;{query.trim()}&rdquo;</b> di daftar. Pencarian ini tercatat supaya bisa kami tambahkan.
              </p>
              <button type="button" className="btn ghost small" onClick={() => setCustom(query.trim().replace(/^./, (c) => c.toUpperCase()))}>
                Tambahkan sebagai makanan buatanku
              </button>
            </>
          ) : tab === "favorit" ? (
            <p>Belum ada favorit. Pilih makanan, lalu ketuk ☆ Favorit di panel jumlahnya.</p>
          ) : tab === "buatanku" ? (
            <button type="button" className="btn ghost small" onClick={() => setCustom("")}>
              + Buat makanan sendiri
            </button>
          ) : (
            <p>Belum ada.</p>
          )}
        </div>
      )}
      {!query.trim() && tab === "buatanku" && list.length > 0 && (
        <button type="button" className="linkish" onClick={() => setCustom("")}>
          + Buat makanan sendiri
        </button>
      )}

      {custom !== null && (
        <CustomForm
          name0={custom}
          onCancel={() => setCustom(null)}
          onCreate={async (f) => {
            const it = await onCreateCustom(f);
            setCustom(null);
            setQuery("");
            setTab("buatanku");
            pick(it);
          }}
        />
      )}

      {item && (
        <div className="amount" ref={panel}>
          <UnitIcon item={item} size={52} />
          <div className="amount-in">
            <div className="amount-title">
              <label className="label" htmlFor="amt">
                {item.name}, berapa {item.unit}?
              </label>
              <button
                type="button"
                className={`fav${isFav ? " on" : ""}`}
                aria-pressed={isFav}
                onClick={() => onToggleFav(item.id, !isFav)}
              >
                {isFav ? "★ Favorit" : "☆ Favorit"}
              </button>
            </div>
            <div className="amount-row">
              <Stepper id="amt" value={amount} min={item.step} max={20} step={item.step} unit={item.unit} onChange={setAmount} />
              {item.fryable && (
                <label className="check">
                  <input type="checkbox" checked={fried} onChange={(e) => setFried(e.target.checked)} />
                  digoreng
                </label>
              )}
            </div>
            {item.group === "minum" && item.unit === "gelas" && (
              <div className="sizes" role="group" aria-label="Ukuran cepat">
                {DRINK_SIZES.map((d) => (
                  <button key={d.label} type="button" aria-pressed={amount === d.amount} onClick={() => setAmount(d.amount)}>
                    {d.label}
                  </button>
                ))}
              </div>
            )}
            {item.sweetable && (
              <div className="sweet" role="group" aria-label="Tingkat manis">
                {SWEET_LEVELS.map((l) => (
                  <button key={l.v} type="button" aria-pressed={sweet === l.v} onClick={() => setSweet(l.v)}>
                    <span className="cubes" aria-hidden>
                      {[1, 2, 3].map((n) => (
                        <i key={n} className={n <= l.v ? "on" : ""} />
                      ))}
                    </span>
                    {l.label}
                  </button>
                ))}
              </div>
            )}
            {preview && (
              <p className="preview num">
                = {n0(preview.kcal)} kkal · protein {preview.p} g · serat {preview.fb} g
                {fried && item.fryable ? " · termasuk minyak yang terserap" : ""}
                {preview.sugar > 0 ? ` · gula ±${Math.round(preview.sugar)} g (≈ ${fmtAmount(Math.max(0.5, Math.round((preview.sugar / 12.5) * 2) / 2))} sdm)` : ""}
              </p>
            )}
          </div>
          <button type="button" className="btn primary" disabled={busy} onClick={add}>
            {busy ? "Menyimpan…" : `Tambah ke ${slotLabel}`}
          </button>
        </div>
      )}
    </div>
  );
}

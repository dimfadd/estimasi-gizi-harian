"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { buildPlan, sanitizeInput, type PlanInput } from "@/lib/nutrition";
import { CODE_KEY, CODE_RE, store, type DbMode } from "@/lib/storage";

export interface Entry {
  id: number | string;
  member_name: string;
  input: PlanInput;
  output: { targetKcal: number; proteinG: number; targetWeightKg: number };
  created_at: string;
}

export interface Member {
  key: string;
  latest: Entry;
  weights: number[];
  dates: string[];
  count: number;
}

export const LOCAL_ENTRIES = "sekepal.entries";

export const localEntries = () => store.json<Entry[]>(LOCAL_ENTRIES, []);

/**
 * Kode keluarga, status database, dan data anggota.
 * Kode bisa datang dari tautan (?k=kode), dari browser ini, atau diketik.
 */
export function useFamily() {
  const [code, setCodeState] = useState("");
  const [mode, setMode] = useState<DbMode>("unknown");
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const fromLink = (url.searchParams.get("k") ?? "").toLowerCase();
    let c = store.get(CODE_KEY) ?? "";
    if (CODE_RE.test(fromLink)) {
      c = fromLink;
      store.set(CODE_KEY, c);
      // hapus ?k dari address bar supaya tidak ikut terbagikan tanpa sengaja
      url.searchParams.delete("k");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
    setCodeState(c);
    fetch("/api/entries?family=cek-koneksi")
      .then((r) => setMode(r.status === 503 ? "local" : "db"))
      .catch(() => setMode("local"));
  }, []);

  const reload = useCallback(async () => {
    setError("");
    if (mode === "local") {
      setEntries(localEntries());
      return;
    }
    if (mode !== "db" || !CODE_RE.test(code)) {
      setEntries([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/entries?family=${encodeURIComponent(code)}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal memuat");
      setEntries(data.entries);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat");
    } finally {
      setLoading(false);
    }
  }, [mode, code]);

  useEffect(() => {
    reload();
  }, [reload]);

  /** simpan kode di browser ini; kode tidak valid hanya mengubah isi kotak */
  const setCode = useCallback((c: string) => {
    setCodeState(c);
    if (CODE_RE.test(c)) store.set(CODE_KEY, c);
  }, []);

  const members = useMemo<Member[]>(() => {
    const by = new Map<string, Entry[]>();
    for (const e of entries) {
      const k = e.member_name.trim().toLowerCase();
      by.set(k, [...(by.get(k) ?? []), e]);
    }
    return [...by.entries()]
      .map(([key, list]) => {
        const sorted = [...list].sort((a, b) => +new Date(a.created_at) - +new Date(b.created_at));
        return {
          key,
          latest: sorted[sorted.length - 1],
          weights: sorted.map((e) => e.input.weightKg),
          dates: sorted.map((e) => e.created_at),
          count: sorted.length,
        };
      })
      .sort((a, b) => a.latest.member_name.localeCompare(b.latest.member_name, "id"));
  }, [entries]);

  /**
   * Simpan satu catatan (data diri + berat hari ini). Kalau database tersambung
   * tapi belum ada kode keluarga, dibuatkan kode acak.
   */
  const saveEntry = useCallback(
    async (raw: PlanInput): Promise<{ ok: true } | { ok: false; error: string }> => {
      const clean = sanitizeInput(raw);
      if (!clean || !clean.name) return { ok: false, error: "Isi nama panggilan dulu." };
      try {
        if (mode !== "db") {
          const p = buildPlan(clean);
          const e: Entry = {
            id: `${Date.now()}`,
            member_name: clean.name,
            input: clean,
            output: { targetKcal: p.targetKcal, proteinG: p.proteinG, targetWeightKg: p.targetWeightKg },
            created_at: new Date().toISOString(),
          };
          const all = [e, ...localEntries()].slice(0, 300);
          store.set(LOCAL_ENTRIES, JSON.stringify(all));
          setEntries(all);
          return { ok: true };
        }
        let c = code;
        if (!CODE_RE.test(c)) {
          c = `keluarga-${Math.random().toString(36).slice(2, 7)}`;
          setCodeState(c);
          store.set(CODE_KEY, c);
        }
        const res = await fetch("/api/entries", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ familyCode: c, input: clean }),
        });
        const data = await res.json();
        if (!res.ok) return { ok: false, error: data.error ?? "Gagal menyimpan" };
        setEntries((xs) => [data.entry, ...xs]);
        return { ok: true };
      } catch {
        return { ok: false, error: "Tidak ada koneksi. Coba lagi." };
      }
    },
    [mode, code],
  );

  const removeEntry = useCallback(
    async (e: Entry) => {
      if (mode !== "db") {
        const all = localEntries().filter((x) => x.id !== e.id);
        store.set(LOCAL_ENTRIES, JSON.stringify(all));
        setEntries(all);
        return true;
      }
      const res = await fetch(`/api/entries?family=${encodeURIComponent(code)}&id=${e.id}`, { method: "DELETE" });
      if (res.ok) setEntries((xs) => xs.filter((x) => x.id !== e.id));
      return res.ok;
    },
    [mode, code],
  );

  return {
    code,
    setCode,
    mode,
    entries,
    members,
    reload,
    saveEntry,
    removeEntry,
    loading,
    error,
    codeValid: CODE_RE.test(code),
  };
}

export type FamilyState = ReturnType<typeof useFamily>;

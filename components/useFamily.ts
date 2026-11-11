"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { PlanInput } from "@/lib/nutrition";
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
        return { key, latest: sorted[sorted.length - 1], weights: sorted.map((e) => e.input.weightKg), count: sorted.length };
      })
      .sort((a, b) => a.latest.member_name.localeCompare(b.latest.member_name, "id"));
  }, [entries]);

  return { code, setCode, mode, entries, setEntries, members, reload, loading, error, codeValid: CODE_RE.test(code) };
}

export type FamilyState = ReturnType<typeof useFamily>;

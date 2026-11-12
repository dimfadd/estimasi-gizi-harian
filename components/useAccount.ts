"use client";

import { useCallback, useEffect, useState } from "react";
import { localDate } from "@/lib/log";
import type { PlanInput } from "@/lib/nutrition";
import { store } from "@/lib/storage";

export interface Profile {
  id: string;
  name: string;
  input: PlanInput;
  created_at: string;
  updated_at: string;
}

export interface Me {
  user: {
    email: string;
    name: string | null;
    image: string | null;
    consent_at: string | null;
    photo_consent_at: string | null;
    admin: boolean;
    pro: boolean;
    pro_until: string | null;
  };
  profiles: Profile[];
  features: { samples: boolean; photoAi: boolean };
}

const ACTIVE_KEY = "sekepal.active";
const OPENED_KEY = "sekepal.opened";

export async function call<T = Record<string, unknown>>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: init?.json !== undefined ? { "content-type": "application/json" } : init?.headers,
    body: init?.json !== undefined ? JSON.stringify(init.json) : init?.body,
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (res.status === 401) {
    window.location.reload();
    throw new Error("Sesi berakhir, silakan masuk lagi");
  }
  if (!res.ok) throw new Error((data as { error?: string }).error ?? "Gagal menghubungi server");
  return data as T;
}

export function useAccount() {
  const [me, setMe] = useState<Me | null>(null);
  const [error, setError] = useState("");
  const [activeId, setActiveIdState] = useState<string>("");

  const reload = useCallback(async () => {
    try {
      const data = await call<Me>("/api/me");
      setMe(data);
      setError("");
      const saved = store.get(ACTIVE_KEY) ?? "";
      setActiveIdState((cur) => {
        const want = cur || saved;
        return data.profiles.some((p) => p.id === want) ? want : (data.profiles[0]?.id ?? "");
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat");
    }
  }, []);

  useEffect(() => {
    reload();
    // hitung "buka aplikasi" sekali per hari per perangkat, untuk retensi
    const today = localDate();
    if (store.get(OPENED_KEY) !== today) {
      store.set(OPENED_KEY, today);
      call("/api/events", { method: "POST", json: { name: "app_open" } }).catch(() => {});
    }
  }, [reload]);

  const setActiveId = (id: string) => {
    setActiveIdState(id);
    store.set(ACTIVE_KEY, id);
  };

  const consent = async () => {
    await call("/api/me/consent", { method: "POST", json: {} });
    await reload();
  };

  const setPhotoConsent = async (on: boolean) => {
    await call("/api/me/consent", { method: "POST", json: { photo: on } });
    await reload();
  };

  const createProfile = async (input: PlanInput) => {
    const { profile } = await call<{ profile: Profile }>("/api/profiles", { method: "POST", json: { input } });
    setMe((m) => (m ? { ...m, profiles: [...m.profiles, profile] } : m));
    setActiveId(profile.id);
    return profile;
  };

  const updateProfile = async (id: string, input: PlanInput) => {
    const { profile } = await call<{ profile: Profile }>(`/api/profiles/${id}`, { method: "PATCH", json: { input } });
    setMe((m) => (m ? { ...m, profiles: m.profiles.map((p) => (p.id === id ? profile : p)) } : m));
    return profile;
  };

  const deleteProfile = async (id: string) => {
    await call(`/api/profiles/${id}`, { method: "DELETE" });
    setMe((m) => {
      if (!m) return m;
      const profiles = m.profiles.filter((p) => p.id !== id);
      if (activeId === id) setActiveId(profiles[0]?.id ?? "");
      return { ...m, profiles };
    });
  };

  const active = me?.profiles.find((p) => p.id === activeId) ?? null;

  return { me, error, reload, active, activeId, setActiveId, consent, setPhotoConsent, createProfile, updateProfile, deleteProfile };
}

export type Account = ReturnType<typeof useAccount>;

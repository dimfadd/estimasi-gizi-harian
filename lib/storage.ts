// localStorage yang tidak melempar error di mode privat / storage diblokir
export const store = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, val: string) {
    try {
      localStorage.setItem(key, val);
    } catch {
      /* abaikan */
    }
  },
  json<T>(key: string, fallback: T): T {
    try {
      const v = localStorage.getItem(key);
      return v ? (JSON.parse(v) as T) : fallback;
    } catch {
      return fallback;
    }
  },
};

export const CODE_KEY = "sekepal.family";
export const CODE_RE = /^[a-z0-9-]{4,32}$/;
export type DbMode = "db" | "local" | "unknown";

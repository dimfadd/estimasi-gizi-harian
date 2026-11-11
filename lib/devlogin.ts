/** Login uji lokal: hanya kalau DEV_LOGIN=1 dan TIDAK berjalan di Vercel. */
export const devLoginEnabled = process.env.DEV_LOGIN === "1" && process.env.VERCEL !== "1";

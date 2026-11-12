import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { NextResponse } from "next/server";
import * as z from "zod/v4";
import { sql } from "@/lib/db";
import { FOOD_DB } from "@/lib/fooddb";
import { handScaleOf } from "@/lib/nutrition";
import { track } from "@/lib/server/events";
import { requirePro } from "@/lib/server/pro";
import { profileInput } from "@/lib/server/profiles";
import { api, HttpError, requireProfile, requireUser } from "@/lib/server/session";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Model bisa diganti lewat env, mis. PHOTO_MODEL=claude-haiku-5-5 untuk biaya lebih rendah.
const MODEL = process.env.PHOTO_MODEL || "claude-opus-5-5";
const DAILY_LIMIT = 20;
const MAX_BYTES = 4 * 1024 * 1024;

const IDS = FOOD_DB.map((f) => f.id) as [string, ...string[]];

const Draft = z.object({
  items: z
    .array(
      z.object({
        food_id: z.enum(IDS),
        amount: z.number(),
        fried: z.boolean(),
        sweet: z.number().int(),
        confidence: z.enum(["tinggi", "sedang", "rendah"]),
        seen_as: z.string(),
      }),
    )
    .describe("Makanan & minuman yang terlihat, dalam satuan katalog"),
  unlisted: z.array(z.object({ name: z.string(), kcal: z.number() })).describe("Yang terlihat tapi tidak ada di katalog"),
  questions: z.array(z.string()).describe("Maksimal 3 pertanyaan singkat tentang yang tidak terlihat dari foto"),
  note: z.string(),
});

// Katalog sebagai prompt sistem: sama untuk semua permintaan → bisa di-cache.
const CATALOG = FOOD_DB.map((f) => `${f.id} | ${f.name} | per ${f.unit}${f.fryable ? " | bisa digoreng" : ""}${f.sweetable ? " | ada tingkat manis" : ""}`).join("\n");

const SYSTEM = `Kamu membantu aplikasi Sekepal mencatat makanan orang Indonesia dari foto. Tugasmu menulis DRAF catatan; pengguna akan mengoreksinya.

Aturan:
- Pakai hanya food_id dari katalog di bawah. Jumlah (amount) dalam satuan katalog itu, kelipatan 0,5.
- Satuan tangan (kepal, telapak, genggam, ibu jari) mengikuti tangan pengguna; ukuran gram per satuan diberikan di pesan pengguna.
- Untuk piring berisi beberapa komponen (nasi + lauk + sayur), catat per komponen, bukan sebagai satu hidangan jadi. Pakai id hidangan jadi (mis. bakso_mangkuk, soto_ayam, nasi_goreng) hanya kalau memang satu hidangan.
- fried = true kalau lauknya jelas digoreng dan item itu "bisa digoreng". Kalau item sudah bernama goreng (mis. ayam_goreng), fried = false.
- sweet hanya untuk item "ada tingkat manis": 0 tanpa gula, 1 tidak terlalu manis, 2 manis, 3 manis sekali. Kalau tidak bisa ditebak dari foto, pakai 2 dan tanyakan. Untuk item lain sweet = 0.
- Perkirakan porsi dari ukuran piring/gelas/sendok di foto. Jangan menebak makanan yang tidak terlihat.
- Yang tidak ada di katalog masukkan ke unlisted dengan perkiraan kalori.
- questions: maksimal 3 pertanyaan pendek berbahasa Indonesia tentang hal penting yang tidak terlihat (santan, gula, nasi di bawah lauk, ukuran gelas). Kosongkan kalau tidak perlu.
- note: satu kalimat ringkas tentang isi foto. Kalau bukan foto makanan/minuman, items kosong dan jelaskan di note.

Katalog (food_id | nama | satuan):
${CATALOG}`;

export const POST = api(async (req: Request) => {
  const uid = await requireUser();
  await requirePro(uid);
  if (!process.env.ANTHROPIC_API_KEY) throw new HttpError(503, "Fitur foto belum disambungkan (ANTHROPIC_API_KEY)");

  const form = await req.formData();
  const pid = await requireProfile(uid, form.get("profile"));
  const photo = form.get("photo");
  const hint = String(form.get("note") ?? "").slice(0, 200);
  if (!(photo instanceof File) || !["image/jpeg", "image/webp", "image/png"].includes(photo.type) || photo.size > MAX_BYTES)
    throw new HttpError(400, "Foto harus JPG/PNG/WebP maksimal 4 MB");

  const [{ n }] = await sql<{ n: string }>`select count(*) as n from photo_ai where user_id = ${uid} and created_at > now() - interval '1 day'`;
  if (Number(n) >= DAILY_LIMIT) throw new HttpError(429, `Batas ${DAILY_LIMIT} foto per hari tercapai. Catat manual dulu, ya.`);

  const input = await profileInput(uid, pid);
  const k = handScaleOf(input.heightCm, input.sex);
  const handInfo = `Ukuran tangan pengguna: 1 kepal ≈ ${Math.round(150 * k)} g nasi / ${Math.round(90 * k)} g sayur, 1 telapak ≈ ${Math.round(100 * k)} g lauk matang, 1 genggam ≈ ${Math.round(40 * k)} g, 1 ibu jari ≈ 1 sdm minyak. 1 gelas = 250 ml.`;

  const data = Buffer.from(await photo.arrayBuffer()).toString("base64");
  const client = new Anthropic();
  let res;
  try {
    res = await client.beta.messages.parse({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      output_config: { effort: "medium", format: betaZodOutputFormat(Draft) },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: photo.type as "image/jpeg" | "image/webp" | "image/png", data } },
            { type: "text", text: `${handInfo}${hint ? `\nCatatan pengguna: ${hint}` : ""}\nTulis draf catatannya.` },
          ],
        },
      ],
    });
  } catch (e) {
    console.error("photo ai", e);
    if (e instanceof Anthropic.RateLimitError) throw new HttpError(429, "Server foto sedang sibuk, coba lagi sebentar.");
    if (e instanceof Anthropic.APIError) throw new HttpError(502, "Gagal membaca foto. Coba lagi atau catat manual.");
    throw e;
  }

  if (res.stop_reason === "refusal" || !res.parsed_output) throw new HttpError(422, "Foto tidak bisa dibaca. Coba foto lain atau catat manual.");
  const out = res.parsed_output;
  const byId = Object.fromEntries(FOOD_DB.map((f) => [f.id, f]));
  const items = out.items
    .filter((it) => it.amount > 0)
    .map((it) => {
      const f = byId[it.food_id];
      return {
        foodId: it.food_id,
        amount: Math.min(20, Math.max(f.step, Math.round(it.amount / f.step) * f.step)),
        fried: it.fried && f.fryable,
        sweet: f.sweetable ? Math.min(3, Math.max(0, it.sweet)) : 0,
        confidence: it.confidence,
        seenAs: it.seen_as.slice(0, 80),
      };
    });

  const [row] = await sql<{ id: string }>`
    insert into photo_ai (user_id, model, ai_items, questions, input_tokens, output_tokens)
    values (${uid}, ${res.model}, ${JSON.stringify({ items, unlisted: out.unlisted })}::jsonb, ${JSON.stringify(out.questions)}::jsonb,
            ${res.usage.input_tokens}, ${res.usage.output_tokens})
    returning id`;
  await track(uid, "photo_ai", { n: items.length });

  return NextResponse.json({
    draftId: row.id,
    items,
    unlisted: out.unlisted.slice(0, 5),
    questions: out.questions.slice(0, 3),
    note: out.note,
    left: DAILY_LIMIT - Number(n) - 1,
  });
});

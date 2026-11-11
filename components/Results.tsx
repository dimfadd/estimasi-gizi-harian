"use client";

import { useState } from "react";
import { FOODS, SNACKS } from "@/lib/foods";
import { fmtAmount, plateFor, plateTotals, type Meal, type Plan, type Portion } from "@/lib/nutrition";
import { FoodIcon, HandIcon, type HandKind } from "./art";

const id = new Intl.NumberFormat("id-ID");
const n0 = (x: number) => id.format(Math.round(x));
const n1 = (x: number) => x.toLocaleString("id-ID", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

function Head({ idx, title, children }: { idx: string; title: string; children?: React.ReactNode }) {
  return (
    <div className="sec-head">
      <span className="idx">{idx}</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}

/* ================================================================ jatah harian */

export function Daily({ plan }: { plan: Plan }) {
  const { targetKcal, tdee, deltaKcal, proteinG, carbG, fatG, daily, mode } = plan;
  const kP = proteinG * 4,
    kC = carbG * 4,
    kF = fatG * 9;
  const tot = kP + kC + kF;
  const pct = (k: number) => Math.round((k / tot) * 100);
  const wk = Math.abs(plan.weeklyChangeKg);

  const paceText =
    mode === "defisit"
      ? `Berat turun sekitar ${n1(wk)} kg per minggu.`
      : mode === "surplus"
        ? `Berat naik sekitar ${n1(wk)} kg per minggu.`
        : mode === "rekomposisi"
          ? "Berat relatif tetap; lemak turun pelan, otot naik pelan. Ukur dari celana, bukan timbangan."
          : "Berat dijaga tetap.";

  return (
    <section className="section" id="jatah">
      <div className="wrap">
        <Head idx="02" title="Jatah sehari">
          Ini total untuk satu hari. Pembagiannya per waktu makan ada di bagian Isi Piring.
        </Head>
        <div className="daily">
          <div className="card kcal-card">
            <div className="big">
              {n0(targetKcal)}
              <small>kkal/hari</small>
            </div>
            <div className="eq num">
              <div>
                <span>Kebutuhan harian</span>
                <span>{n0(tdee)}</span>
              </div>
              <div>
                <span>{deltaKcal < 0 ? "Defisit" : deltaKcal > 0 ? "Surplus" : "Selisih"}</span>
                <span>
                  {deltaKcal > 0 ? "+" : deltaKcal < 0 ? "−" : ""}
                  {n0(Math.abs(deltaKcal))}
                </span>
              </div>
              <div className="sum">
                <span>Target makan</span>
                <span>{n0(targetKcal)}</span>
              </div>
            </div>
            <div className="pace">{paceText}</div>
          </div>

          <div>
            <div className="tiles">
              <Tile icon={<HandIcon kind="telapak" size={46} />} what="Lauk" amt={fmtAmount(daily.proteinPalms)} unit="telapak" sub={`≈ ${proteinG} g protein`} />
              <Tile icon={<HandIcon kind="kepal" size={46} />} what="Nasi" amt={fmtAmount(daily.carbFists)} unit="kepal" sub="atau penggantinya" />
              <Tile icon={<FoodIcon id="sayur" size={46} />} what="Sayur" amt={fmtAmount(daily.vegFists)} unit="kepal" sub={`serat ±${plan.fiberG} g`} />
              <Tile icon={<HandIcon kind="ibu jari" size={46} />} what="Minyak" amt={fmtAmount(daily.oilThumbs)} unit="ibu jari" sub="termasuk untuk menggoreng" />
              <Tile icon={<FoodIcon id="air" size={46} />} what="Air putih" amt={String(plan.waterGlasses)} unit="gelas" sub="gelas 250 ml" />
            </div>

            <div className="card macro">
              <div className="macro-bar" role="img" aria-label={`Protein ${pct(kP)}%, karbohidrat ${pct(kC)}%, lemak ${pct(kF)}%`}>
                <div style={{ width: `${pct(kP)}%`, background: "var(--mac-p)" }}>Protein {pct(kP)}%</div>
                <div style={{ width: `${pct(kC)}%`, background: "var(--mac-c)", color: "var(--ink)" }}>Karbo {pct(kC)}%</div>
                <div style={{ width: `${pct(kF)}%`, background: "var(--mac-f)" }}>Lemak {pct(kF)}%</div>
              </div>
              <div className="macro-legend">
                <div>
                  <i className="dot" style={{ background: "var(--mac-p)" }} />
                  Protein <b>{proteinG}</b> g
                </div>
                <div>
                  <i className="dot" style={{ background: "var(--mac-c)" }} />
                  Karbohidrat <b>{carbG}</b> g
                </div>
                <div>
                  <i className="dot" style={{ background: "var(--mac-f)" }} />
                  Lemak <b>{fatG}</b> g
                </div>
              </div>
            </div>

            {plan.notes.length > 0 && (
              <ul className="notes">
                {plan.notes.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Tile({ icon, what, amt, unit, sub }: { icon: React.ReactNode; what: string; amt: string; unit: string; sub: string }) {
  return (
    <div className="card tile">
      {icon}
      <span className="what">{what}</span>
      <span className="amt">
        {amt}
        <small>{unit}</small>
      </span>
      <span className="sub">{sub}</span>
    </div>
  );
}

/* ================================================================ panduan tangan */

export function HandGuide({ plan }: { plan: Plan }) {
  const s = plan.handScale;
  const items: { kind: HandKind; title: string; eq: string; text: string }[] = [
    {
      kind: "kepal",
      title: "Kepalan tangan",
      eq: `≈ ${Math.round(150 * s)} g nasi · ${Math.round(90 * s)} g sayur`,
      text: "Untuk nasi, kentang, ubi, dan sayur. Nasi dipadatkan seperti dikepal, bukan ditumpuk longgar.",
    },
    {
      kind: "telapak",
      title: "Telapak tangan",
      eq: `≈ ${Math.round(100 * s)} g ayam/ikan matang`,
      text: "Selebar dan setebal telapak, tanpa jari. Untuk ayam, ikan, daging, tempe.",
    },
    {
      kind: "ibu jari",
      title: "Ruas ibu jari",
      eq: `≈ 1 sdm · ${Math.round(10 * s)} g lemak`,
      text: "Untuk minyak, santan, mentega, selai kacang. Gorengan menyerap ±½–1 ibu jari.",
    },
    {
      kind: "genggam",
      title: "Genggam (cekung)",
      eq: `≈ ${Math.round(40 * s)} g oat/kacang kering`,
      text: "Telapak ditekuk seperti mangkuk. Untuk oat, kacang, sereal, buah potong.",
    },
  ];
  return (
    <section className="section" id="tangan">
      <div className="wrap">
        <Head idx="04" title="Cara menakar pakai tangan">
          Tangan ikut besar kalau badan besar, jadi takarannya otomatis menyesuaikan. Angka gram di bawah sudah disesuaikan dengan
          tinggi dan jenis kelaminmu.
        </Head>
        <div className="hands">
          {items.map((it) => (
            <div key={it.kind} className="card hand">
              <HandIcon kind={it.kind} size={72} />
              <div>
                <h3>{it.title}</h3>
                <div className="eq">{it.eq}</div>
                <p>{it.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ================================================================ isi piring */

function Icons({ part, max = 4 }: { part: Portion; max?: number }) {
  const n = part.amount;
  const whole = Math.floor(n + 1e-9);
  const half = n - whole >= 0.5 - 1e-9;
  const shown = Math.min(whole, max);
  const count = shown + (half ? 1 : 0);
  const w = `${Math.min(48, 96 / Math.max(1, Math.ceil(count / (count > 2 ? 2 : 1))))}%`;
  return (
    <>
      {Array.from({ length: shown }, (_, i) => (
        <div key={i} style={{ width: w }}>
          <FoodIcon id={part.foodId} size="100%" />
        </div>
      ))}
      {half && (
        <div className="half" style={{ width: w }}>
          <div style={{ clipPath: "inset(0 50% 0 0)" }}>
            <FoodIcon id={part.foodId} size="100%" />
          </div>
          <span>½</span>
        </div>
      )}
    </>
  );
}

function PlateArt({ carb, protein, veg }: { carb?: Portion; protein: Portion[]; veg: Portion }) {
  return (
    <div className="plate" aria-hidden>
      <svg className="base" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="48.5" fill="#fff" stroke="#26261F" strokeWidth="1.2" />
        <circle cx="50" cy="50" r="40" fill="#FBFAF6" stroke="#E1DACB" strokeWidth="0.8" />
        <path d="M50 10 V90 M50 50 H90" stroke="#E1DACB" strokeWidth="0.8" strokeDasharray="2 1.6" />
      </svg>
      {/* sayur: separuh kiri */}
      <div className="zone" style={{ left: "13%", top: "18%", width: "36%", height: "64%" }}>
        <Icons part={{ ...veg, amount: Math.min(veg.amount, 3) }} />
        <div className="cap">
          Sayur <span className="num">{veg.label}</span>
        </div>
      </div>
      {/* karbo: kanan atas */}
      <div className="zone" style={{ left: "52%", top: "12%", width: "34%", height: "36%" }}>
        {carb && <Icons part={carb} />}
        {carb && (
          <div className="cap">
            <span className="num">{carb.label}</span>
          </div>
        )}
      </div>
      {/* lauk: kanan bawah */}
      <div className="zone" style={{ left: "52%", top: "52%", width: "34%", height: "34%" }}>
        {protein.map((p) => (
          <Icons key={p.foodId} part={p} max={3} />
        ))}
        <div className="cap">
          <span className="num">{protein.map((p) => p.label).join(" + ")}</span>
        </div>
      </div>
    </div>
  );
}

function MealView({ meal }: { meal: Meal }) {
  const [protKey, setProtKey] = useState(meal.defaultProtein);
  const [carbId, setCarbId] = useState(meal.defaultCarb);
  const validProt = meal.proteinOptions.some((o) => o.key === protKey) ? protKey : meal.defaultProtein;
  const plate = plateFor(meal, validProt);
  const carb = plate.carbOptions.find((o) => o.foodId === carbId) ?? plate.carbOptions[0];
  const totals = plateTotals(meal, carb?.foodId ?? "", validProt);
  const prot = plate.protein;

  return (
    <div className="card meal">
      <div className="plate-wrap">
        <PlateArt carb={carb} protein={prot?.parts ?? []} veg={meal.veg} />
        <div className="plate-total">
          <span>
            Satu piring ≈ <b>{n0(totals.kcal)}</b> kkal
          </span>
          <span>
            protein <b>{totals.p}</b> g · serat <b>{totals.fb}</b> g
          </span>
        </div>
      </div>

      <div className="pick">
        <div>
          <h3>
            Karbo <small>pilih salah satu</small>
          </h3>
          <div className="opts">
            {plate.carbOptions.map((o) => (
              <button key={o.foodId} type="button" className="opt" aria-pressed={o.foodId === carb?.foodId} onClick={() => setCarbId(o.foodId)}>
                <FoodIcon id={o.foodId} size={44} />
                <div>
                  <b>{o.label}</b>
                  <span>{FOODS[o.foodId].name}</span>
                </div>
              </button>
            ))}
          </div>
          {carb && <p className="howto">{FOODS[carb.foodId].howTo}</p>}
        </div>

        <div>
          <h3>
            Lauk <small>pilih salah satu · jumlah nasi menyesuaikan</small>
          </h3>
          <div className="opts">
            {meal.proteinOptions.map((o) => (
              <button key={o.key} type="button" className="opt" aria-pressed={o.key === validProt} onClick={() => setProtKey(o.key)}>
                <span className="icons">
                  {o.parts.map((p) => (
                    <FoodIcon key={p.foodId} id={p.foodId} size={o.parts.length > 1 ? 34 : 44} />
                  ))}
                </span>
                <div>
                  <b>{o.parts.map((p) => p.label).join(" + ")}</b>
                  <span>{o.parts.map((p) => FOODS[p.foodId].name).join(" + ")}</span>
                </div>
              </button>
            ))}
          </div>
          {prot && <p className="howto">{prot.parts.map((p) => FOODS[p.foodId].howTo).join(" ")}</p>}
        </div>

        <div className="fixed-row">
          <div className="fixed">
            <FoodIcon id="sayur" size={44} />
            <div>
              <b>{meal.veg.label}</b>
              sayur apa saja, boleh sayur bening/tumis
            </div>
          </div>
          <div className="fixed">
            <HandIcon kind="ibu jari" size={44} />
            <div>
              <b>{plate.oil.amount > 0 ? `${fmtAmount(plate.oil.amount)} ibu jari` : "0 ibu jari"}</b>
              {plate.oil.amount > 0 ? "minyak/santan untuk masak" : "lauk dikukus, direbus, atau dibakar"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Meals({ plan }: { plan: Plan }) {
  const [tab, setTab] = useState(0);
  const i = Math.min(tab, plan.meals.length - 1);
  const meal = plan.meals[i];
  return (
    <section className="section" id="piring">
      <div className="wrap">
        <Head idx="05" title="Isi piring">
          Separuh piring sayur, seperempat nasi, seperempat lauk. Pilih lauk yang ada di rumah; porsi nasinya ikut menyesuaikan supaya
          kalorinya tetap pas.
        </Head>
        <div className="tabs" role="tablist">
          {plan.meals.map((m, k) => (
            <button key={m.key} role="tab" aria-selected={k === i} onClick={() => setTab(k)}>
              {m.label}
              <span className="num">{n0(m.kcal)} kkal</span>
            </button>
          ))}
        </div>
        {/* key memaksa pilihan di-reset kalau rencananya berubah */}
        <MealView key={`${meal.key}-${meal.kcal}-${meal.proteinG}`} meal={meal} />
      </div>
    </section>
  );
}

/* ================================================================ camilan */

export function Snacks({ plan }: { plan: Plan }) {
  const kg = plan.input.weightKg;
  const walkPerMin = (4.3 * 3.5 * kg) / 200; // jalan cepat, MET 4,3
  const good = SNACKS.filter((s) => s.good);
  const bad = SNACKS.filter((s) => !s.good);
  return (
    <section className="section" id="camilan">
      <div className="wrap">
        <Head idx="06" title="Camilan">
          Ngemil boleh, asal masuk jatah. Yang sering bikin defisit gagal bukan nasinya, tapi minuman manis dan gorengan di sela kerja.
        </Head>
        <div className="card snack-budget">
          <FoodIcon id="pisang" size={44} />
          <div>
            Jatah camilan sehari <b className="num">{n0(plan.snackKcal)}</b> kkal
            <div className="fine">Sudah termasuk dalam {n0(plan.targetKcal)} kkal. Kalau tidak ngemil, boleh ditambah ke makan malam.</div>
          </div>
        </div>
        <div className="snack-cols">
          <div>
            <h3>Pilihan yang aman</h3>
            <div className="snack-list">
              {good.map((s) => {
                const fit = Math.floor(plan.snackKcal / s.kcal);
                return (
                  <div key={s.id} className="card snack">
                    <FoodIcon id={s.id} size={48} />
                    <div className="nm">
                      {s.name}
                      <span>
                        {s.portion} · protein {s.p} g
                      </span>
                    </div>
                    <div className="k">
                      {s.kcal}
                      <span>{fit >= 1 ? `muat ${fit}× sehari` : "lebih dari jatah"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h3>Yang diam-diam mahal</h3>
            <div className="snack-list">
              {bad.map((s) => {
                const share = (s.kcal / plan.targetKcal) * 100;
                return (
                  <div key={s.id} className="card snack bad">
                    <FoodIcon id={s.id} size={48} />
                    <div className="nm">
                      {s.name}
                      <span>{s.portion}</span>
                      <div className="meter" aria-hidden>
                        <div style={{ width: `${Math.min(100, share * 3)}%` }} />
                      </div>
                    </div>
                    <div className="k">
                      {s.kcal}
                      <span>= {Math.round(s.kcal / walkPerMin)} menit jalan cepat</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================ perjalanan */

function addWeeks(weeks: number) {
  const d = new Date();
  d.setDate(d.getDate() + weeks * 7);
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

function ProjectionChart({ start, end, weeks }: { start: number; end: number; weeks: number }) {
  const W = 600,
    H = 220,
    L = 44,
    R = 16,
    T = 16,
    B = 32;
  const lo = Math.min(start, end),
    hi = Math.max(start, end);
  const pad = Math.max(1, (hi - lo) * 0.15);
  const y0 = lo - pad,
    y1 = hi + pad;
  const x = (w: number) => L + (w / weeks) * (W - L - R);
  const y = (kg: number) => T + (1 - (kg - y0) / (y1 - y0)) * (H - T - B);
  const step = weeks > 30 ? 8 : 4;
  const ticks = Array.from({ length: Math.floor(weeks / step) + 1 }, (_, i) => i * step);
  const yTicks = [y0 + pad, (y0 + y1) / 2, y1 - pad];
  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Dari ${start} kg ke ${end} kg dalam ${weeks} minggu`}>
        {yTicks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#DDD5C4" strokeWidth="1" />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="12" fill="#57584F" fontFamily="var(--mono)">
              {Math.round(t)}
            </text>
          </g>
        ))}
        {ticks.map((t) => (
          <text key={t} x={x(t)} y={H - 10} textAnchor="middle" fontSize="12" fill="#8A897D" fontFamily="var(--mono)">
            {t === 0 ? "kini" : `mg ${t}`}
          </text>
        ))}
        <line x1={x(0)} y1={y(start)} x2={x(weeks)} y2={y(end)} stroke="#C2412D" strokeWidth="3" strokeLinecap="round" />
        {ticks.slice(1).map((t) => (
          <circle key={t} cx={x(t)} cy={y(start + ((end - start) * t) / weeks)} r="3.5" fill="#FBF8F1" stroke="#C2412D" strokeWidth="2" />
        ))}
        <circle cx={x(0)} cy={y(start)} r="6" fill="#22231E" />
        <circle cx={x(weeks)} cy={y(end)} r="6" fill="#C2412D" stroke="#22231E" strokeWidth="2" />
        <text x={x(0) + 10} y={y(start) - 10} fontSize="13" fontWeight="600" fill="#22231E" fontFamily="var(--mono)">
          {n1(start)} kg
        </text>
        <text x={x(weeks) - 8} y={y(end) + (end < start ? -12 : 22)} textAnchor="end" fontSize="13" fontWeight="600" fill="#C2412D" fontFamily="var(--mono)">
          {n1(end)} kg
        </text>
      </svg>
    </div>
  );
}

export function Journey({ plan }: { plan: Plan }) {
  const { input, weeksToGoal, targetWeightKg, mode } = plan;
  const hasChart = weeksToGoal != null && weeksToGoal > 0;

  const tips: { t: string; d: string }[] = [];
  if (input.goal === "naik") {
    tips.push({ t: "Latihan beban 3× seminggu", d: "Supaya yang naik otot, bukan cuma lemak. Squat, push-up/bench press, rowing, deadlift." });
    tips.push({ t: "Kalau susah makan banyak, minum kalorinya", d: "Susu, pisang, dan selai kacang di-blender = ±500 kkal tanpa terasa kenyang." });
  } else {
    tips.push({
      t: "Latihan beban 3× seminggu, seluruh badan",
      d: "Squat, push-up/bench press, rowing, deadlift atau hip hinge, overhead press. 3 set × 8–12 kali, berhenti saat masih sisa 1–2 repetisi.",
    });
    tips.push({
      t: "Naikkan beban sedikit demi sedikit",
      d: "Kalau 12 repetisi sudah ringan, tambah 1–2,5 kg. Angkat beban yang sama berbulan-bulan tidak memberi alasan badan untuk berubah.",
    });
  }
  if (input.work === "duduk") {
    tips.push({
      t: "Jalan 7.000–10.000 langkah sehari",
      d: "Untuk pekerja kantoran, gerak di luar gym membakar lebih banyak dari 30 menit kardio. Berdiri dan jalan 5 menit tiap jam.",
    });
  }
  tips.push({ t: "Tidur 7 jam", d: "Kurang tidur menaikkan rasa lapar dan keinginan ngemil manis keesokan harinya." });
  tips.push({ t: "Timbang seminggu sekali, jam yang sama", d: "Berat harian naik-turun 1–2 kg karena air dan garam. Lihat tren 2–3 minggu, bukan angka satu hari." });

  return (
    <section className="section" id="perjalanan">
      <div className="wrap">
        <Head idx="07" title="Perkiraan perjalanan" />
        <div className="journey">
          <div className="card chart-card">
            {hasChart ? (
              <>
                <h3>
                  {n1(targetWeightKg)} kg sekitar {addWeeks(weeksToGoal!)}
                </h3>
                <p className="lead">
                  ±{weeksToGoal} minggu kalau konsisten. Garis lurus ini penyederhanaan: minggu pertama biasanya turun lebih cepat karena
                  air, lalu wajar kalau sempat mandek 1–2 minggu.
                </p>
                <ProjectionChart start={input.weightKg} end={targetWeightKg} weeks={weeksToGoal!} />
              </>
            ) : (
              <>
                <h3>{mode === "rekomposisi" ? "Ukur dari lingkar perut, bukan timbangan" : "Tidak ada target berat"}</h3>
                <p className="lead">
                  {mode === "rekomposisi"
                    ? "Saat rekomposisi, berat bisa diam di angka yang sama selama berminggu-minggu sementara perut mengecil. Pakai celana yang sama sebagai patokan: kalau ikat pinggang mundur satu lubang, programnya jalan."
                    : input.goal === "otot"
                      ? "Target program otot: kekuatan naik tiap minggu, berat naik ±0,25 kg/minggu. Kalau berat naik lebih cepat dari itu, kurangi nasi ½ kepal sehari."
                      : input.goal === "jaga"
                        ? "Kalau dalam 3 minggu berat naik terus, kurangi nasi ½ kepal sehari. Kalau turun terus, tambah ½ kepal."
                        : "Isi berapa kilogram yang mau dicapai di formulir untuk melihat perkiraan waktunya."}
                </p>
              </>
            )}
          </div>
          <div className="card train">
            <h3>Yang menentukan hasil</h3>
            <ol>
              {tips.map((t) => (
                <li key={t.t}>
                  <b>{t.t}</b>
                  {t.d}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ================================================================ cara hitung */

export function Method({ plan }: { plan: Plan }) {
  return (
    <section className="section" id="cara-hitung">
      <div className="wrap">
        <Head idx="09" title="Cara hitungnya">
          Semua angka di sini perkiraan. Tubuh tiap orang berbeda ±10%; sesuaikan setelah 2–3 minggu berdasarkan hasil timbangan.
        </Head>
        <div className="card method">
          <details>
            <summary>Kebutuhan kalori (BMR × aktivitas)</summary>
            <p>
              BMR pakai rumus Mifflin–St Jeor: <code>10×berat + 6,25×tinggi − 5×umur {plan.input.sex === "pria" ? "+ 5" : "− 161"}</code> ={" "}
              <b className="num">{n0(plan.bmr)}</b> kkal. Dikali faktor aktivitas <b className="num">{plan.activityFactor.toFixed(3)}</b> (kerja harian +
              olahraga) = <b className="num">{n0(plan.tdee)}</b> kkal.
            </p>
          </details>
          <details>
            <summary>Defisit / surplus</summary>
            <p>
              1 kg lemak ≈ 7.700 kkal. Turun ½ kg/minggu butuh defisit ±550 kkal/hari. Defisit dibatasi maksimal 25% kebutuhan, dan kalori tidak
              turun di bawah 1.500 (pria) / 1.200 (wanita).
            </p>
          </details>
          <details>
            <summary>Protein, lemak, karbo</summary>
            <ul>
              <li>Protein 1,4–2,0 g per kg tergantung tujuan. Untuk yang BMI-nya di atas 25, dihitung dari berat badan saat BMI 25, bukan berat sekarang.</li>
              <li>Lemak ±27% kalori, minimal 0,6 g/kg.</li>
              <li>Karbohidrat mengisi sisanya.</li>
            </ul>
          </details>
          <details>
            <summary>Lemak tubuh &amp; bentuk badan 3D</summary>
            <p>
              Persen lemak diperkirakan dari BMI, umur, dan jenis kelamin (Deurenberg, 1991): saat ini ±{Math.round(plan.bodyFatPct)}%. Rumus ini
              meleset ±5%, terutama untuk orang yang berotot. Bentuk 3D hanya ilustrasi dari angka ini.
            </p>
          </details>
          <details>
            <summary>Serat</summary>
            <p>
              Target serat 14 g per 1.000 kkal (pedoman AKG/IOM), untukmu ±<b className="num">{plan.fiberG}</b> g. Nasi putih hampir tidak
              berserat; sumber utamanya sayur, buah, nasi merah, ubi, jagung, oat, dan kacang-kacangan.
            </p>
          </details>
          <details>
            <summary>Ukuran tangan → gram</summary>
            <p>
              Satu kepal nasi pria dewasa (±170 cm) ≈ 150 g, satu telapak lauk ≈ 100 g, satu ruas ibu jari ≈ 1 sendok makan. Ukuran ini diskalakan
              dengan tinggi badan (wanita ×0,9). Skala tanganmu: <b className="num">{plan.handScale.toFixed(2)}</b>. Data gizi dari Tabel Komposisi
              Pangan Indonesia dan USDA.
            </p>
          </details>
        </div>
      </div>
    </section>
  );
}

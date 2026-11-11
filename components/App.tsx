"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildPlan, sanitizeInput, type PlanInput } from "@/lib/nutrition";
import InstallButton from "./InstallButton";
import MemberBar from "./MemberBar";
import Profile from "./Profile";
import Progress from "./Progress";
import { Daily, HandGuide, Meals, Snacks } from "./Results";
import Setup from "./Setup";
import Tracker from "./Tracker";
import { useFamily } from "./useFamily";

const DEFAULT: PlanInput = {
  name: "",
  sex: "pria",
  age: 30,
  heightCm: 165,
  weightKg: 65,
  work: "duduk",
  exercise: 1,
  goal: "jaga",
  changeKg: 5,
  pace: "sedang",
  meals: 3,
};

const DRAFT_KEY = "sekepal.draft";

type Tab = "hari" | "makan" | "progres" | "profil";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  {
    key: "hari",
    label: "Hari ini",
    icon: (
      <path d="M5 5h14v15H5z M9 3v4 M15 3v4 M8 11h8 M8 15h5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    ),
  },
  {
    key: "makan",
    label: "Mau makan apa",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" fill="none" />
        <circle cx="12" cy="12" r="4.5" fill="none" />
      </>
    ),
  },
  {
    key: "progres",
    label: "Progres",
    icon: <path d="M4 19h16 M5 15l4-5 4 3 6-7" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  },
  {
    key: "profil",
    label: "Profil",
    icon: (
      <>
        <circle cx="12" cy="8" r="3.8" fill="none" />
        <path d="M4.5 20c1-4 4-5.5 7.5-5.5s6.5 1.5 7.5 5.5" fill="none" strokeLinecap="round" />
      </>
    ),
  },
];

const HASH_TAB: Record<string, Tab> = { "#catat": "hari", "#piring": "makan", "#progres": "progres", "#profil": "profil" };

export default function App() {
  const [input, setInput] = useState<PlanInput>(DEFAULT);
  const [view, setView] = useState<"loading" | "setup" | "edit" | "app">("loading");
  const [tab, setTab] = useState<Tab>("hari");
  const before = useRef<PlanInput | null>(null);
  const fam = useFamily();

  // ingat isian terakhir di browser ini
  useEffect(() => {
    let saved: PlanInput | null = null;
    try {
      saved = sanitizeInput(JSON.parse(localStorage.getItem(DRAFT_KEY) ?? "null"));
    } catch {}
    if (saved) setInput(saved);
    setView(saved?.name ? "app" : "setup");
    const t = HASH_TAB[window.location.hash];
    if (t) setTab(t);
  }, []);
  useEffect(() => {
    if (view === "loading") return;
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(input));
    } catch {}
  }, [input, view]);

  const plan = useMemo(() => buildPlan(input), [input]);
  const me = input.name.trim().toLowerCase();
  const member = fam.members.find((m) => m.key === me);

  const set = (patch: Partial<PlanInput>) => setInput((s) => ({ ...s, ...patch }));
  const goTab = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
  };
  const open = (i: PlanInput) => {
    setInput(i);
    setView("app");
    goTab("hari");
  };
  const newMember = () => {
    before.current = view === "app" ? input : null;
    setInput({ ...DEFAULT, name: "" });
    setView("setup");
    window.scrollTo({ top: 0 });
    setTimeout(() => document.getElementById("name")?.focus(), 50);
  };
  const edit = () => {
    before.current = input;
    setView("edit");
    window.scrollTo({ top: 0 });
  };
  const cancel = () => {
    if (before.current) setInput(before.current);
    setView("app");
  };
  const saveSetup = async () => {
    const r = await fam.saveEntry(input);
    if (!r.ok) return r.error;
    setView("app");
    goTab("hari");
    return null;
  };
  const weigh = async (patch: Partial<PlanInput>) => {
    // target berat tetap; sisa kg yang perlu dicapai ikut berubah
    const kg = patch.weightKg ?? input.weightKg;
    let changeKg = input.changeKg;
    if (input.goal === "turun") changeKg = Math.max(0, Math.round((kg - (input.weightKg - input.changeKg)) * 10) / 10);
    if (input.goal === "naik") changeKg = Math.max(0, Math.round((input.weightKg + input.changeKg - kg) * 10) / 10);
    const next = { ...input, ...patch, changeKg };
    const r = await fam.saveEntry(next);
    if (!r.ok) return r.error;
    setInput(next);
    return null;
  };

  const inApp = view === "app";

  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="brand">
            <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
              <path d="M8 50 q0 -34 24 -36 q24 2 24 36 q-24 7 -48 0 z" fill="#FFFDF6" stroke="#26261F" strokeWidth="4" strokeLinejoin="round" />
              <path d="M22 34 q3 -2 6 0 M34 28 q3 -2 6 0 M30 42 q3 -2 6 0" stroke="#C2412D" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            </svg>
            Sekepal
            <small>takaran makan pakai tangan sendiri</small>
          </div>
          {inApp && (
            <nav className="tabs-top" aria-label="Menu">
              {TABS.map((t) => (
                <button key={t.key} type="button" aria-current={tab === t.key ? "page" : undefined} onClick={() => goTab(t.key)}>
                  {t.label}
                </button>
              ))}
            </nav>
          )}
          <InstallButton />
        </div>
      </header>
      <MemberBar fam={fam} current={inApp ? input.name : ""} onPick={open} onNew={newMember} />

      <main className={inApp ? "with-nav" : ""}>
        {view === "loading" && <div className="wrap section" aria-busy />}

        {(view === "setup" || view === "edit") && (
          <Setup
            plan={plan}
            set={set}
            editing={view === "edit"}
            onSave={saveSetup}
            onCancel={view === "edit" || before.current ? cancel : undefined}
          />
        )}

        {inApp && tab === "hari" && <Tracker plan={plan} code={fam.code} setCode={fam.setCode} mode={fam.mode} onPlan={() => goTab("makan")} />}

        {inApp && tab === "makan" && (
          <>
            <Meals plan={plan} />
            <Daily plan={plan} />
            <Snacks plan={plan} />
            <HandGuide plan={plan} />
          </>
        )}

        {inApp && tab === "progres" && <Progress key={input.name} plan={plan} member={member} onWeigh={weigh} />}

        {inApp && tab === "profil" && <Profile plan={plan} fam={fam} onEdit={edit} onOpen={open} />}

        <footer className="foot">
          <div className="wrap">
            Sekepal memberi perkiraan untuk orang dewasa sehat. Untuk ibu hamil/menyusui, penderita diabetes, ginjal, atau jantung, konsultasikan
            angka ini ke dokter atau ahli gizi.
          </div>
        </footer>
      </main>

      {inApp && (
        <nav className="tabs-bottom" aria-label="Menu">
          {TABS.map((t) => (
            <button key={t.key} type="button" aria-current={tab === t.key ? "page" : undefined} onClick={() => goTab(t.key)}>
              <svg viewBox="0 0 24 24" width="22" height="22" stroke="currentColor" strokeWidth="1.9" aria-hidden>
                {t.icon}
              </svg>
              <span>{t.key === "makan" ? "Makan apa" : t.label}</span>
            </button>
          ))}
        </nav>
      )}
    </>
  );
}

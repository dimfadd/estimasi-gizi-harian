"use client";

import { useEffect, useMemo, useState } from "react";
import { buildPlan, type PlanInput } from "@/lib/nutrition";
import Consent from "./Consent";
import InstallButton from "./InstallButton";
import Profile from "./Profile";
import ProfileBar from "./ProfileBar";
import Progress from "./Progress";
import { Daily, HandGuide, Meals, Snacks } from "./Results";
import Setup from "./Setup";
import Tracker from "./Tracker";
import { call, useAccount } from "./useAccount";

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
  const account = useAccount();
  const { me, active } = account;
  const [view, setView] = useState<"app" | "new" | "edit">("app");
  const [draft, setDraft] = useState<PlanInput>(DEFAULT);
  const [tab, setTab] = useState<Tab>("hari");

  useEffect(() => {
    const t = HASH_TAB[window.location.hash];
    if (t) setTab(t);
  }, []);

  const noProfile = me != null && me.profiles.length === 0;
  const mode: "loading" | "consent" | "new" | "edit" | "app" = !me
    ? "loading"
    : !me.user.consent_at
      ? "consent"
      : noProfile || view === "new"
        ? "new"
        : view === "edit"
          ? "edit"
          : "app";

  // formulir memakai draft; tampilan pantau memakai data profil yang tersimpan
  const shown: PlanInput = mode === "new" || mode === "edit" ? draft : (active?.input ?? DEFAULT);
  const plan = useMemo(() => buildPlan(shown), [shown]);

  const set = (patch: Partial<PlanInput>) => setDraft((s) => ({ ...s, ...patch }));
  const goTab = (t: Tab) => {
    setTab(t);
    window.scrollTo({ top: 0 });
    call("/api/events", { method: "POST", json: { name: "tab_view", tab: t } }).catch(() => {});
  };
  const pick = (id: string) => {
    account.setActiveId(id);
    setView("app");
  };
  const newProfile = () => {
    setDraft({ ...DEFAULT, name: "" });
    setView("new");
    window.scrollTo({ top: 0 });
    setTimeout(() => document.getElementById("name")?.focus(), 50);
  };
  const edit = () => {
    if (!active) return;
    setDraft(active.input);
    setView("edit");
    window.scrollTo({ top: 0 });
  };
  const save = async () => {
    try {
      if (mode === "edit" && active) await account.updateProfile(active.id, draft);
      else await account.createProfile(draft);
      setView("app");
      setTab("hari");
      window.scrollTo({ top: 0 });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Gagal menyimpan";
    }
  };
  const weigh = async (patch: Partial<PlanInput>) => {
    if (!active) return "Profil belum dipilih";
    const input = active.input;
    // target berat tetap; sisa kg yang perlu dicapai ikut berubah
    const kg = patch.weightKg ?? input.weightKg;
    let changeKg = input.changeKg;
    if (input.goal === "turun") changeKg = Math.max(0, Math.round((kg - (input.weightKg - input.changeKg)) * 10) / 10);
    if (input.goal === "naik") changeKg = Math.max(0, Math.round((input.weightKg + input.changeKg - kg) * 10) / 10);
    try {
      await account.updateProfile(active.id, { ...input, ...patch, changeKg });
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : "Gagal menyimpan";
    }
  };

  const inApp = mode === "app" && active != null;

  return (
    <>
      <header className="top">
        <div className="wrap">
          <div className="brand">
            <svg width="30" height="30" viewBox="0 0 64 64" aria-hidden>
              <path d="M8 50 q0 -34 24 -36 q24 2 24 36 q-24 7 -48 0 z" fill="#FFFDF6" stroke="#26261F" strokeWidth="4" strokeLinejoin="round" />
              <path d="M22 34 q3 -2 6 0 M34 28 q3 -2 6 0 M30 42 q3 -2 6 0" stroke="#C2412D" strokeWidth="3.4" strokeLinecap="round" fill="none" />
            </svg>
            Sekepal <span className="beta">beta</span>
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
      {me && me.user.consent_at && (
        <ProfileBar profiles={me.profiles} activeId={account.activeId} onPick={pick} onNew={newProfile} disabled={mode === "new"} />
      )}

      <main className={inApp ? "with-nav" : ""}>
        {mode === "loading" && (
          <div className="wrap section" aria-busy>
            {account.error ? <div className="status err">{account.error}</div> : <p className="fine">Memuat…</p>}
          </div>
        )}

        {mode === "consent" && <Consent email={me!.user.email} onAgree={account.consent} />}

        {(mode === "new" || mode === "edit") && (
          <Setup
            plan={plan}
            set={set}
            editing={mode === "edit"}
            onSave={save}
            onCancel={!noProfile ? () => setView("app") : undefined}
          />
        )}

        {inApp && tab === "hari" && (
          <Tracker
            key={active.id}
            plan={plan}
            profileId={active.id}
            samplesEnabled={me!.features.samples}
            photoConsent={Boolean(me!.user.photo_consent_at)}
            onPhotoConsent={() => account.setPhotoConsent(true)}
            onPlan={() => goTab("makan")}
          />
        )}

        {inApp && tab === "makan" && (
          <>
            <Meals plan={plan} />
            <Daily plan={plan} />
            <Snacks plan={plan} />
            <HandGuide plan={plan} />
          </>
        )}

        {inApp && tab === "progres" && <Progress key={active.id} plan={plan} profileId={active.id} onWeigh={weigh} />}

        {inApp && tab === "profil" && <Profile plan={plan} account={account} onEdit={edit} />}

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

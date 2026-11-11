"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export default function InstallButton() {
  const [evt, setEvt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(true);
  const [help, setHelp] = useState(false);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setIos(/iPhone|iPad|iPod/i.test(navigator.userAgent));

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvt(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setEvt(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed || (!evt && !ios)) return null;

  return (
    <div className="install">
      <button
        type="button"
        className="btn small"
        onClick={async () => {
          if (evt) {
            await evt.prompt();
            await evt.userChoice;
            setEvt(null);
          } else setHelp((h) => !h);
        }}
      >
        Pasang di HP
      </button>
      {help && (
        <div className="install-help card" role="dialog" aria-label="Cara memasang di iPhone">
          <b>Di iPhone (Safari):</b>
          <ol>
            <li>Ketuk tombol Bagikan (kotak dengan panah ke atas) di bawah layar.</li>
            <li>Pilih &ldquo;Tambah ke Layar Utama&rdquo;.</li>
            <li>Ketuk &ldquo;Tambah&rdquo;.</li>
          </ol>
          <button type="button" className="linkish" onClick={() => setHelp(false)}>
            tutup
          </button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { call } from "./useAccount";

export function ProBadge() {
  return <span className="pro-badge">PRO</span>;
}

const FEATURES: [string, string][] = [
  ["Catat dari foto", "Foto piring atau minuman, AI menulis drafnya: nasi berapa kepal, lauk apa, ada sayur atau tidak. Kamu tinggal koreksi."],
  ["Latihan gym 3D", "Gerakan beranimasi untuk tiap otot, bagian yang dilatih ditandai merah. Catat set, beban, dan repetisi."],
  ["Lari, sepeda & olahraga lain", "Masukkan jarak dan waktu, pace dan kalori dihitung otomatis."],
  ["Target ikut aktivitas", "Hari kamu berolahraga lebih berat, jatah makan bertambah. Perkiraan perubahan berat dari makan + aktivitas."],
];

/** Lembar penawaran Pro. Belum ada pembayaran: tombol mencatat minat (daftar tunggu). */
export function ProSheet({ feature, onClose }: { feature: string; onClose: () => void }) {
  const [done, setDone] = useState(false);
  useEffect(() => {
    call("/api/events", { method: "POST", json: { name: "pro_view", feature } }).catch(() => {});
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [feature, onClose]);
  return (
    <div className="sheet-back" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal aria-label="Sekepal Pro" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <h2>
            Sekepal <ProBadge />
          </h2>
          <button type="button" className="x" aria-label="Tutup" onClick={onClose}>
            ×
          </button>
        </div>
        <ul className="pro-list">
          {FEATURES.map(([t, d]) => (
            <li key={t}>
              <b>{t}</b>
              <span>{d}</span>
            </li>
          ))}
        </ul>
        {done ? (
          <div className="status ok">Tercatat. Pembayaran Pro segera dibuka, kami kabari lewat email akunmu.</div>
        ) : (
          <button
            type="button"
            className="btn primary wide-btn"
            onClick={() => {
              call("/api/events", { method: "POST", json: { name: "pro_interest", feature } }).catch(() => {});
              setDone(true);
            }}
          >
            Saya mau Pro
          </button>
        )}
        <p className="fine">Fitur gratis yang sudah ada tetap gratis.</p>
      </div>
    </div>
  );
}

/** Pratinjau terkunci: isi tetap terlihat samar, dengan tombol buka Pro. */
export function Locked({ children, title, onUpsell }: { children: React.ReactNode; title: string; onUpsell: () => void }) {
  return (
    <div className="locked">
      <div className="locked-inner" aria-hidden>
        {children}
      </div>
      <div className="locked-cover">
        <ProBadge />
        <b>{title}</b>
        <button type="button" className="btn primary small" onClick={onUpsell}>
          Lihat Sekepal Pro
        </button>
      </div>
    </div>
  );
}

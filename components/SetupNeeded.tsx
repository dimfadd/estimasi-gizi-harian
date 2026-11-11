export default function SetupNeeded({ missing }: { missing: string[] }) {
  return (
    <main className="wrap consent">
      <div className="card consent-card">
        <h1>Konfigurasi belum lengkap</h1>
        <p>Sekepal butuh variabel lingkungan berikut di Vercel (Settings → Environment Variables), lalu redeploy:</p>
        <ul>
          {missing.map((m) => (
            <li key={m}>
              <code>{m}</code>
            </li>
          ))}
        </ul>
        <p className="fine">Langkah lengkapnya ada di README repositori.</p>
      </div>
    </main>
  );
}

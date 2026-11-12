// Ilustrasi digambar manual, viewBox 64×64, gaya stiker: isi rata + garis tinta.
import type { ReactNode, SVGProps } from "react";

const INK = "#26261F";
const line = { stroke: INK, strokeWidth: 2.2, strokeLinejoin: "round", strokeLinecap: "round" } as const;
const thin = { ...line, strokeWidth: 1.5 } as const;

const SKIN = "#E8B48C";
const SKIN_DARK = "#CF9468";
const HILITE = "#F2C14E";

type Size = number | "100%";

function Svg({ children, size = 64, title, ...rest }: { children: ReactNode; size?: Size; title?: string } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} style={{ display: "block" }} role={title ? "img" : "presentation"} aria-label={title} {...rest}>
      {children}
    </svg>
  );
}

/* ------------------------------------------------------------------ tangan */

export type HandKind = "kepal" | "telapak" | "ibu jari" | "genggam";

function Fist() {
  return (
    <>
      <rect x="24" y="50" width="18" height="12" rx="3" fill={SKIN_DARK} {...line} />
      {[16, 24, 32, 40].map((x, i) => (
        <rect key={x} x={x} y={14 + (i === 0 || i === 3 ? 3 : 0)} width="9" height={30 - (i === 3 ? 4 : 0)} rx="4.5" fill={SKIN} {...line} />
      ))}
      <path d="M12 40 q0 -6 7 -6 h18 q5 0 5 5 q0 5 -5 5 h-18 q-7 0 -7 -4 z" fill={SKIN} {...line} />
      <path d="M14 42 q4 10 14 12 h12 q8 -2 8 -10 v-8" fill={SKIN} {...line} />
      <path d="M33 37 h4" {...thin} fill="none" />
    </>
  );
}

function Palm() {
  return (
    <>
      {[
        [18, 12, 18],
        [25, 6, 24],
        [32, 5, 25],
        [39, 9, 21],
      ].map(([x, y, h]) => (
        <rect key={x} x={x} y={y} width="7" height={h + 8} rx="3.5" fill={SKIN} {...line} />
      ))}
      <path d="M18 44 l-9 -12 q-3 -5 2 -7 q4 -1 6 3 l5 8" fill={SKIN} {...line} />
      <rect x="17" y="28" width="30" height="28" rx="7" fill={SKIN} {...line} />
      <rect x="20.5" y="31.5" width="23" height="21" rx="4" fill={HILITE} opacity="0.9" stroke={INK} strokeWidth="1.5" strokeDasharray="3 2.5" />
    </>
  );
}

function Thumb() {
  return (
    <>
      <rect x="20" y="6" width="11" height="30" rx="5.5" fill={SKIN} {...line} />
      <path d="M21 8 q4.5 -3 9 0 v9 h-9 z" fill={HILITE} stroke={INK} strokeWidth="1.5" strokeDasharray="3 2.5" />
      <rect x="18" y="28" width="30" height="28" rx="8" fill={SKIN} {...line} />
      {[35, 42, 49].map((y) => (
        <path key={y} d={`M30 ${y} h17`} {...thin} fill="none" />
      ))}
      <path d="M20 30 q4 4 10 2" {...thin} fill="none" />
    </>
  );
}

function Cupped() {
  return (
    <>
      <path d="M14 30 q-2 -4 3 -4 h30 q5 0 3 4" fill="#D9B77A" {...thin} />
      {[18, 24, 30, 36, 42, 27, 33, 39, 21].map((x, i) => (
        <ellipse key={i} cx={x + 1} cy={i > 5 ? 24 : 27} rx="3" ry="1.6" fill="#EBD3A0" {...thin} />
      ))}
      <path d="M8 30 h48 q-2 22 -24 24 q-22 -2 -24 -24 z" fill={SKIN} {...line} />
      <path d="M14 38 q18 8 36 0" {...thin} fill="none" />
      <path d="M50 30 q6 -2 6 4" {...line} fill="none" />
    </>
  );
}

export function HandIcon({ kind, size = 64 }: { kind: HandKind; size?: number }) {
  return (
    <Svg size={size} title={kind}>
      {kind === "kepal" && <Fist />}
      {kind === "telapak" && <Palm />}
      {kind === "ibu jari" && <Thumb />}
      {kind === "genggam" && <Cupped />}
    </Svg>
  );
}

/* ------------------------------------------------------------------ makanan */

function Rice({ fill, grain }: { fill: string; grain: string }) {
  return (
    <>
      <ellipse cx="32" cy="50" rx="27" ry="7" fill="#F4F1EA" {...line} />
      <path d="M10 48 q0 -30 22 -31 q22 1 22 31 q-22 6 -44 0 z" fill={fill} {...line} />
      {[
        [22, 30],
        [30, 25],
        [38, 31],
        [26, 39],
        [35, 40],
        [44, 40],
        [18, 42],
        [31, 33],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q2 -1.5 4 0`} stroke={grain} strokeWidth="1.6" strokeLinecap="round" fill="none" />
      ))}
    </>
  );
}

function Fish({ body, belly, extra, deep = 1 }: { body: string; belly: string; extra?: ReactNode; deep?: number }) {
  const ry = 11 * deep;
  return (
    <>
      <path d={`M48 32 l12 -10 q-2 10 0 20 z`} fill={body} {...line} />
      <path d={`M6 32 q12 -${ry + 8} 42 0 q-30 ${ry + 8} -42 0 z`} fill={body} {...line} />
      <path d={`M10 34 q16 ${ry - 2} 36 -1`} fill="none" stroke={belly} strokeWidth="3" strokeLinecap="round" />
      {extra}
      <circle cx="15" cy="29" r="2.2" fill="#fff" {...thin} />
      <circle cx="15.3" cy="29.2" r="0.9" fill={INK} />
      <path d="M22 26 q2 6 0 12" {...thin} fill="none" />
    </>
  );
}

const FOOD_ART: Record<string, () => ReactNode> = {
  nasi_putih: () => <Rice fill="#FFFDF6" grain="#D8D2C2" />,
  nasi_merah: () => <Rice fill="#C98A79" grain="#9E5F52" />,
  jagung: () => (
    <>
      <path d="M14 52 q-6 -22 16 -38 q-8 18 -4 34 z" fill="#7FA651" {...line} />
      <rect x="22" y="8" width="18" height="44" rx="9" transform="rotate(25 31 30)" fill="#F2C14E" {...line} />
      {[0, 1, 2, 3, 4, 5].map((r) =>
        [0, 1].map((c) => (
          <circle key={`${r}${c}`} cx={36 - r * 3.3 + c * 5} cy={14 + r * 6.5 + c * 2} r="1.7" fill="#E0A126" />
        )),
      )}
      <path d="M50 54 q4 -18 -12 -34 q6 18 2 34 z" fill="#93B866" {...line} />
    </>
  ),
  ubi: () => (
    <>
      <path d="M8 36 q6 -18 28 -18 q20 0 22 12 q-2 14 -26 16 q-20 2 -24 -10 z" fill="#A54E5E" {...line} />
      <ellipse cx="51" cy="31" rx="6" ry="9" fill="#F0A24A" {...line} />
      <path d="M20 30 q4 -2 8 0 M30 40 q4 -2 7 0" {...thin} fill="none" />
    </>
  ),
  kentang: () => (
    <>
      <path d="M10 34 q2 -18 22 -20 q22 -1 24 16 q0 18 -24 20 q-22 0 -22 -16 z" fill="#CBA36A" {...line} />
      {[
        [22, 28],
        [38, 24],
        [44, 38],
        [28, 42],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x} ${y} q2 1 3 0`} {...thin} fill="none" />
      ))}
    </>
  ),
  singkong: () => (
    <>
      <path d="M6 40 l40 -22 q8 -3 10 4 q2 7 -6 10 l-40 16 q-6 1 -4 -8 z" fill="#7B5537" {...line} />
      <ellipse cx="51" cy="25" rx="5" ry="7" transform="rotate(-25 51 25)" fill="#F7F1E3" {...line} />
      <path d="M18 40 l20 -10 M14 46 l14 -6" stroke="#5B3D26" strokeWidth="1.6" strokeLinecap="round" />
    </>
  ),
  oat: () => (
    <>
      {[20, 26, 32, 38, 44, 23, 29, 35, 41].map((x, i) => (
        <ellipse key={i} cx={x} cy={i > 4 ? 24 : 28} rx="3" ry="1.7" fill="#EBD3A0" {...thin} />
      ))}
      <path d="M8 30 h48 q-3 22 -24 24 q-21 -2 -24 -24 z" fill="#E7E2D6" {...line} />
      <path d="M14 36 h36" stroke="#C9C2B2" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  roti: () => (
    <>
      <path d="M12 54 v-26 q-6 -2 -4 -10 q4 -10 24 -10 q20 0 24 10 q2 8 -4 10 v26 z" fill="#B97A3E" {...line} />
      <path d="M17 50 v-25 q-4 -2 -2 -7 q4 -6 17 -6 q13 0 17 6 q2 5 -2 7 v25 z" fill="#F6DDB0" />
    </>
  ),
  telur: () => (
    <>
      <path d="M8 34 q-2 -16 14 -18 q6 -8 18 -4 q14 2 16 16 q4 14 -10 18 q-10 6 -24 2 q-14 -2 -14 -14 z" fill="#FFFFFF" {...line} />
      <circle cx="31" cy="32" r="9" fill="#F2A52B" {...line} />
      <circle cx="28" cy="29" r="2.5" fill="#F8CC6E" />
    </>
  ),
  putih_telur: () => (
    <>
      <path d="M8 34 q-2 -16 14 -18 q6 -8 18 -4 q14 2 16 16 q4 14 -10 18 q-10 6 -24 2 q-14 -2 -14 -14 z" fill="#FFFFFF" {...line} />
      <path d="M20 30 q4 -6 10 -6" stroke="#E4DFD3" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  edamame: () => (
    <>
      {[
        [10, 40, -25],
        [22, 22, 10],
        [30, 44, -5],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x + 14} ${y})`}>
          <path d={`M${x} ${y} q0 -8 9 -8 q5 0 7 4 q2 -4 7 -4 q9 0 9 8 q0 8 -9 8 q-5 0 -7 -4 q-2 4 -7 4 q-9 0 -9 -8 z`} fill="#7DAA4F" {...line} />
          <circle cx={x + 8} cy={y} r="2.6" fill="#A9CF7A" />
          <circle cx={x + 24} cy={y} r="2.6" fill="#A9CF7A" />
        </g>
      ))}
    </>
  ),
  dada_ayam: () => (
    <>
      <path d="M8 38 q0 -20 24 -24 q22 -2 24 14 q2 16 -22 22 q-26 4 -26 -12 z" fill="#E9BE95" {...line} />
      <path d="M18 30 l10 14 M28 24 l12 16 M40 22 l8 10" stroke="#B9814F" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  paha_atas: () => (
    <>
      <path d="M10 36 q-2 -18 18 -22 q22 -4 26 14 q2 16 -18 22 q-24 6 -26 -14 z" fill="#D88A3A" {...line} />
      <path d="M18 26 q4 -4 8 0 M34 22 q4 -3 7 1 M24 40 q5 -3 9 1 M40 36 q3 -3 6 0" stroke="#A7611F" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  paha_bawah: () => (
    <>
      <path d="M36 34 l14 14" stroke={INK} strokeWidth="9" strokeLinecap="round" />
      <path d="M36 34 l14 14" stroke="#F6EFE0" strokeWidth="5" strokeLinecap="round" />
      <circle cx="52" cy="47" r="4" fill="#F6EFE0" {...line} />
      <circle cx="48" cy="52" r="4" fill="#F6EFE0" {...line} />
      <path d="M8 22 q2 -14 18 -12 q16 4 14 22 q-2 8 -10 8 q-18 -2 -22 -18 z" fill="#D88A3A" {...line} />
      <path d="M16 18 q4 -3 7 0 M22 28 q4 -3 7 0" stroke="#A7611F" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  kembung: () => (
    <Fish
      body="#5F7F98"
      belly="#CFDCE3"
      extra={[18, 25, 32, 39].map((x) => <circle key={x} cx={x + 2} cy={24} r="1.4" fill="#2E4456" />)}
    />
  ),
  lele: () => (
    <Fish
      body="#56504A"
      belly="#A69B8E"
      deep={0.8}
      extra={<path d="M7 31 q-4 2 -5 8 M8 33 q-2 4 0 9 M7 30 q-4 -3 -5 -7" {...thin} fill="none" />}
    />
  ),
  nila: () => (
    <Fish
      body="#8E9C8C"
      belly="#D9DED2"
      deep={1.25}
      extra={[26, 32, 38].map((x) => <path key={x} d={`M${x} 20 v22`} stroke="#6E7B6C" strokeWidth="2" strokeLinecap="round" />)}
    />
  ),
  ikan_potong: () => (
    <>
      <path d="M10 34 q0 -20 22 -20 q22 0 22 20 q0 16 -22 16 q-22 0 -22 -16 z" fill="#D9958A" {...line} />
      <path d="M18 32 q0 -10 14 -10 q14 0 14 10 q0 9 -14 9 q-14 0 -14 -9 z" fill="none" stroke="#B9665A" strokeWidth="1.8" />
      <circle cx="32" cy="31" r="3" fill="#F3E7DE" {...thin} />
      <path d="M32 14 v-4 M32 50 v4" {...thin} />
    </>
  ),
  daging: () => (
    <>
      <path d="M8 32 q2 -18 26 -18 q22 0 22 16 q0 18 -26 20 q-24 0 -22 -18 z" fill="#9F4436" {...line} />
      <path d="M12 26 q10 -10 26 -10" fill="none" stroke="#F3E3D3" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M22 34 q8 -4 14 2 M30 42 q6 -2 10 2" stroke="#7D3328" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </>
  ),
  tempe: () => (
    <>
      <path d="M8 26 l12 -10 h36 l-12 10 z" fill="#F0DEB2" {...line} />
      <path d="M44 26 l12 -10 v16 l-12 12 z" fill="#C9A86C" {...line} />
      <rect x="8" y="26" width="36" height="18" fill="#E5CC92" {...line} />
      {[
        [14, 32],
        [21, 38],
        [27, 31],
        [34, 37],
        [39, 31],
        [17, 39],
        [30, 21],
        [42, 20],
        [22, 22],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="2" ry="1.4" fill="#B79458" />
      ))}
    </>
  ),
  tahu: () => (
    <>
      <path d="M12 24 l10 -10 h30 l-10 10 z" fill="#FFF8E6" {...line} />
      <path d="M42 24 l10 -10 v28 l-10 10 z" fill="#E7DCC0" {...line} />
      <rect x="12" y="24" width="30" height="28" fill="#F7EED6" {...line} />
      <path d="M18 32 h4 M28 40 h6 M20 46 h3" stroke="#DCCFAE" strokeWidth="1.8" strokeLinecap="round" />
    </>
  ),
  sayur: () => (
    <>
      <path d="M32 58 v-24" stroke="#3E6B34" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 40 q-24 -2 -22 -26 q20 2 22 26 z" fill="#5E9B4D" {...line} />
      <path d="M32 40 q24 -2 22 -26 q-20 2 -22 26 z" fill="#4C8A3E" {...line} />
      <path d="M32 34 q-8 -16 0 -30 q8 14 0 30 z" fill="#79B25F" {...line} />
      <path d="M18 22 l12 14 M46 22 l-12 14" stroke="#2F5A28" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="16" cy="52" r="6" fill="#E46B3A" {...line} />
      <circle cx="48" cy="52" r="6" fill="#E46B3A" {...line} />
    </>
  ),
  minyak: () => (
    <>
      <path d="M32 6 q16 22 16 34 q0 16 -16 16 q-16 0 -16 -16 q0 -12 16 -34 z" fill="#E7AE34" {...line} />
      <path d="M24 40 q0 8 7 9" stroke="#F7DA8E" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  pisang: () => (
    <>
      <path d="M10 22 q4 28 30 30 q14 0 18 -6 q-22 2 -34 -28 z" fill="#F2CC4A" {...line} />
      <path d="M12 20 l-4 -6" {...line} />
      <path d="M20 30 q8 14 26 18" stroke="#D9A92E" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </>
  ),
  air: () => (
    <>
      <path d="M16 8 h32 l-4 48 h-24 z" fill="#EEF4F7" {...line} />
      <path d="M19 26 h26 l-2.5 28 h-21 z" fill="#8CB8D6" />
      <path d="M16 8 h32 l-4 48 h-24 z" fill="none" {...line} />
      <path d="M22 30 v18" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </>
  ),

  /* ikon kategori untuk database makanan */
  apel: () => (
    <>
      <path d="M32 18 q-6 -6 -14 -4 q-12 4 -10 22 q2 16 14 20 q6 2 10 -1 q4 3 10 1 q12 -4 14 -20 q2 -18 -10 -22 q-8 -2 -14 4 z" fill="#D2483A" {...line} />
      <path d="M32 18 q0 -8 4 -12" {...line} fill="none" />
      <path d="M36 10 q8 -6 14 -2 q-6 8 -14 2 z" fill="#6E9F4C" {...line} />
      <path d="M18 28 q-2 6 0 12" stroke="#F2A79C" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  mangkuk: () => (
    <>
      <path d="M22 14 q-3 4 0 8 M32 10 q-3 5 0 10 M42 14 q-3 4 0 8" stroke="#8A897D" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M6 30 h52 q-2 22 -26 24 q-24 -2 -26 -24 z" fill="#F4F1EA" {...line} />
      <ellipse cx="32" cy="30" rx="26" ry="5" fill="#E2B04A" {...line} />
      <circle cx="24" cy="29" r="3" fill="#B87A4B" />
      <circle cx="36" cy="30" r="3.4" fill="#B87A4B" />
      <path d="M40 28 q4 -2 6 1" stroke="#4C8A3E" strokeWidth="2.4" strokeLinecap="round" fill="none" />
      <path d="M26 56 h12" {...line} />
    </>
  ),
  piring_isi: () => (
    <>
      <ellipse cx="32" cy="38" rx="28" ry="16" fill="#FFFFFF" {...line} />
      <ellipse cx="32" cy="38" rx="20" ry="10" fill="#F6F2EA" stroke="#DCD4C3" strokeWidth="1.4" />
      <path d="M14 38 q2 -12 12 -12 q10 0 10 12 q-11 4 -22 0 z" fill="#FFFDF6" {...thin} />
      <path d="M34 36 q4 -8 12 -6 q6 2 4 8 q-8 4 -16 -2 z" fill="#D88A3A" {...thin} />
      <path d="M30 44 q4 -4 8 0 q4 -4 8 0" stroke="#4C8A3E" strokeWidth="2.6" strokeLinecap="round" fill="none" />
    </>
  ),
  sambal: () => (
    <>
      <ellipse cx="32" cy="46" rx="22" ry="8" fill="#9C9A8C" {...line} />
      <path d="M12 44 q0 -14 20 -14 q20 0 20 14 q-20 6 -40 0 z" fill="#C2412D" {...line} />
      <circle cx="24" cy="38" r="1.6" fill="#F2C14E" />
      <circle cx="34" cy="35" r="1.6" fill="#F2C14E" />
      <circle cx="40" cy="40" r="1.6" fill="#F2C14E" />
      <path d="M44 22 q8 -10 14 -8 q-2 8 -14 8 z" fill="#C2412D" {...line} />
      <path d="M44 22 q-4 4 -2 8" stroke="#4C8A3E" strokeWidth="2.4" strokeLinecap="round" fill="none" />
    </>
  ),

  /* buah */
  jeruk: () => (
    <>
      <circle cx="32" cy="36" r="22" fill="#F39A1E" {...line} />
      {[
        [24, 30],
        [38, 28],
        [30, 42],
        [42, 40],
        [20, 40],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#D97A0B" />
      ))}
      <path d="M32 14 v-5" {...line} />
      <path d="M33 11 q8 -7 15 -2 q-7 7 -15 2 z" fill="#5E9B4D" {...line} />
    </>
  ),
  pepaya: () => (
    <>
      <path d="M10 22 q22 -16 44 0 q4 26 -22 34 q-26 -8 -22 -34 z" fill="#F08A2E" {...line} />
      <path d="M16 24 q16 -10 32 0 q2 18 -16 24 q-18 -6 -16 -24 z" fill="#F7B267" />
      <ellipse cx="32" cy="32" rx="8" ry="10" fill="#FCD9A8" />
      {[
        [29, 28],
        [34, 30],
        [30, 34],
        [35, 36],
        [32, 39],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.8" fill="#26261F" />
      ))}
    </>
  ),
  semangka: () => (
    <>
      <path d="M6 22 h52 q-2 30 -26 32 q-24 -2 -26 -32 z" fill="#3E8E41" {...line} />
      <path d="M10 22 h44 q-3 25 -22 27 q-19 -2 -22 -27 z" fill="#F4F1EA" />
      <path d="M13 22 h38 q-3 21 -19 23 q-16 -2 -19 -23 z" fill="#E84855" />
      <path d="M6 22 h52" {...line} />
      {[
        [22, 28],
        [32, 32],
        [42, 28],
        [27, 37],
        [37, 37],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1.2" ry="2" fill="#26261F" />
      ))}
    </>
  ),
  melon: () => (
    <>
      <path d="M6 24 h52 q-2 28 -26 30 q-24 -2 -26 -30 z" fill="#C9D98B" {...line} />
      <path d="M11 24 h42 q-3 23 -21 25 q-18 -2 -21 -25 z" fill="#B8DE7C" />
      <path d="M20 24 h24 q-2 12 -12 13 q-10 -1 -12 -13 z" fill="#E9EFC2" />
      <path d="M6 24 h52" {...line} />
      <path d="M12 34 q6 -4 10 2 M42 36 q6 -6 10 -2" stroke="#A9B862" strokeWidth="1.4" fill="none" />
    </>
  ),
  mangga: () => (
    <>
      <path d="M14 30 q2 -18 22 -18 q18 2 20 18 q2 20 -20 24 q-24 2 -22 -24 z" fill="#F2B43C" {...line} />
      <path d="M40 16 q6 6 8 18" stroke="#E0832A" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.7" />
      <path d="M30 13 v-5" {...line} />
      <path d="M31 9 q-10 -6 -16 0 q8 6 16 0 z" fill="#5E9B4D" {...line} />
    </>
  ),
  nanas: () => (
    <>
      <path d="M32 22 l-8 -14 l6 4 l2 -8 l2 8 l6 -4 z" fill="#5E9B4D" {...line} />
      <ellipse cx="32" cy="40" rx="15" ry="19" fill="#E8B23A" {...line} />
      <path d="M20 30 l24 20 M20 44 l20 -18 M24 52 l18 -16 M22 36 l18 16 M26 24 l14 12 M24 24 l-4 4" stroke="#B9861E" strokeWidth="1.5" fill="none" />
    </>
  ),
  salak: () => (
    <>
      <path d="M32 8 q20 14 18 30 q-2 18 -18 18 q-16 0 -18 -18 q-2 -16 18 -30 z" fill="#7A3E2B" {...line} />
      {[
        [26, 26],
        [36, 26],
        [24, 36],
        [32, 34],
        [40, 36],
        [28, 46],
        [36, 46],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x - 3} ${y + 2} l3 -4 l3 4`} stroke="#B97A5E" strokeWidth="1.5" fill="none" />
      ))}
    </>
  ),
  anggur: () => (
    <>
      <path d="M32 6 v8" {...line} />
      <path d="M33 10 q10 -6 16 0 q-8 6 -16 0 z" fill="#5E9B4D" {...line} />
      {[
        [24, 20],
        [32, 20],
        [40, 20],
        [20, 30],
        [28, 30],
        [36, 30],
        [44, 30],
        [24, 40],
        [32, 40],
        [40, 40],
        [28, 50],
        [36, 50],
        [32, 58],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="5.5" fill="#7B4FA0" {...thin} />
      ))}
    </>
  ),
  alpukat: () => (
    <>
      <path d="M32 6 q14 4 16 22 q4 26 -16 30 q-20 -4 -16 -30 q2 -18 16 -22 z" fill="#3E6B34" {...line} />
      <path d="M32 12 q10 4 11 18 q3 20 -11 23 q-14 -3 -11 -23 q1 -14 11 -18 z" fill="#C9DB7E" />
      <circle cx="32" cy="38" r="8" fill="#8A5A3B" {...thin} />
    </>
  ),
  jambu_biji: () => (
    <>
      <circle cx="32" cy="36" r="22" fill="#9CC75A" {...line} />
      <circle cx="32" cy="36" r="16" fill="#F28B8B" />
      {[
        [26, 32],
        [36, 30],
        [30, 40],
        [38, 40],
        [33, 35],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.4" fill="#F6E7C8" />
      ))}
      <path d="M32 14 v-5" {...line} />
    </>
  ),
  buah_naga: () => (
    <>
      <ellipse cx="32" cy="36" rx="18" ry="21" fill="#E2367C" {...line} />
      <ellipse cx="32" cy="38" rx="12" ry="14" fill="#F7F5F2" />
      {Array.from({ length: 14 }, (_, i) => (
        <circle key={i} cx={24 + (i % 4) * 5.5} cy={29 + Math.floor(i / 4) * 5.5} r="0.9" fill="#26261F" />
      ))}
      <path d="M18 24 l-8 -6 l12 2 M46 24 l8 -6 l-12 2 M32 15 l0 -8" stroke="#6E9F4C" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  rambutan: () => (
    <>
      {Array.from({ length: 18 }, (_, i) => {
        const a = (i / 18) * Math.PI * 2;
        return <path key={i} d={`M${32 + Math.cos(a) * 18} ${34 + Math.sin(a) * 18} q${Math.cos(a + 0.6) * 6} ${Math.sin(a + 0.6) * 6} ${Math.cos(a) * 8} ${Math.sin(a) * 8}`} stroke="#4C8A3E" strokeWidth="2" strokeLinecap="round" fill="none" />;
      })}
      <circle cx="32" cy="34" r="18" fill="#D2363A" {...line} />
      <circle cx="26" cy="28" r="4" fill="#E86A6D" />
    </>
  ),
  kelengkeng: () => (
    <>
      <path d="M32 6 q-2 10 -10 16 M32 6 q2 10 10 16 M32 6 v20" {...thin} fill="none" />
      {[
        [20, 30],
        [34, 28],
        [44, 38],
        [26, 44],
        [38, 50],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="8" fill="#C9A26B" {...thin} />
      ))}
    </>
  ),
  manggis: () => (
    <>
      <circle cx="32" cy="38" r="20" fill="#5B2245" {...line} />
      <path d="M20 22 q12 -10 24 0 q-12 6 -24 0 z" fill="#5E9B4D" {...line} />
      <path d="M32 18 v-8" {...line} />
      <circle cx="26" cy="32" r="3" fill="#7E3A62" />
    </>
  ),
  durian: () => (
    <>
      {Array.from({ length: 14 }, (_, i) => {
        const a = (i / 14) * Math.PI * 2;
        const x = 32 + Math.cos(a) * 20,
          y = 36 + Math.sin(a) * 18;
        return <path key={i} d={`M${x - 3} ${y} l${Math.cos(a) * 6} ${Math.sin(a) * 6} l${3 - Math.cos(a) * 0} 0`} fill="#8C9A3C" {...thin} />;
      })}
      <ellipse cx="32" cy="36" rx="20" ry="18" fill="#9DAA45" {...line} />
      {[
        [24, 30],
        [34, 28],
        [42, 36],
        [28, 42],
        [38, 44],
        [22, 38],
      ].map(([x, y], i) => (
        <path key={i} d={`M${x - 2.5} ${y + 2} l2.5 -5 l2.5 5 z`} fill="#6F7C2A" />
      ))}
      <path d="M32 18 v-10" {...line} />
    </>
  ),
  kurma: () => (
    <>
      <ellipse cx="22" cy="34" rx="10" ry="16" transform="rotate(-20 22 34)" fill="#7A3E1E" {...line} />
      <ellipse cx="42" cy="34" rx="10" ry="16" transform="rotate(20 42 34)" fill="#8E4B26" {...line} />
      <path d="M18 26 q4 8 2 16 M44 26 q-4 8 -2 16" stroke="#A9653A" strokeWidth="1.6" fill="none" />
    </>
  ),
  stroberi: () => (
    <>
      <path d="M12 24 q20 -8 40 0 q-2 22 -20 34 q-18 -12 -20 -34 z" fill="#E23D45" {...line} />
      {[
        [22, 30],
        [32, 28],
        [42, 30],
        [26, 38],
        [36, 38],
        [31, 46],
      ].map(([x, y], i) => (
        <ellipse key={i} cx={x} cy={y} rx="1" ry="1.6" fill="#F7D96B" />
      ))}
      <path d="M16 22 l8 -8 l6 6 l2 -10 l2 10 l6 -6 l8 8 q-16 6 -32 0 z" fill="#5E9B4D" {...line} />
    </>
  ),

  /* sayur tunggal */
  tomat: () => (
    <>
      <circle cx="32" cy="36" r="20" fill="#E23D3D" {...line} />
      <path d="M22 18 l10 6 l10 -6 l-4 8 l-6 -2 l-6 2 z" fill="#5E9B4D" {...line} />
      <path d="M22 30 q-2 6 0 10" stroke="#F28B8B" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  timun: () => (
    <>
      <rect x="6" y="24" width="52" height="18" rx="9" transform="rotate(-20 32 33)" fill="#4C8A3E" {...line} />
      {[
        [18, 36],
        [28, 32],
        [38, 28],
        [46, 26],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="1.3" fill="#A9CF7A" />
      ))}
      <ellipse cx="54" cy="24" rx="4" ry="8" transform="rotate(-20 54 24)" fill="#D8EBB5" {...thin} />
    </>
  ),
  wortel: () => (
    <>
      <path d="M44 14 l-34 38 q-2 2 0 3 q2 1 4 -1 l36 -34 z" fill="#F08A2E" {...line} />
      <path d="M22 40 l5 4 M30 32 l5 4 M37 24 l4 3" stroke="#C9661A" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M46 16 q2 -12 10 -10 M48 18 q10 -6 12 2 M46 16 q-6 -10 2 -12" stroke="#4C8A3E" strokeWidth="3" strokeLinecap="round" fill="none" />
    </>
  ),
  brokoli: () => (
    <>
      <path d="M28 58 l2 -20 h4 l2 20 z" fill="#8DBF5A" {...line} />
      {[
        [20, 30, 10],
        [32, 22, 11],
        [44, 30, 10],
        [32, 34, 9],
      ].map(([x, y, r], i) => (
        <circle key={i} cx={x} cy={y} r={r} fill="#3E7D32" {...line} />
      ))}
      <circle cx="28" cy="22" r="2" fill="#5E9B4D" />
      <circle cx="18" cy="28" r="2" fill="#5E9B4D" />
    </>
  ),

  /* minuman */
  teh: () => FOOD_ART.es_teh(),
  kopi: () => (
    <>
      <path d="M12 22 h34 v18 q0 14 -17 14 q-17 0 -17 -14 z" fill="#F4F1EA" {...line} />
      <path d="M46 26 q10 0 10 8 q0 8 -10 8" fill="none" {...line} />
      <ellipse cx="29" cy="24" rx="15" ry="3.2" fill="#3B2618" />
      <path d="M22 8 q-3 4 0 8 M30 6 q-3 5 0 10 M38 8 q-3 4 0 8" stroke="#8A897D" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <ellipse cx="29" cy="56" rx="22" ry="3" fill="none" {...thin} />
    </>
  ),
  susu_gelas: () => (
    <>
      <path d="M16 8 h32 l-4 48 h-24 z" fill="#FFFFFF" {...line} />
      <path d="M18.6 18 h26.8 l-3.2 37 h-20.4 z" fill="#F4F0E6" />
      <path d="M16 8 h32 l-4 48 h-24 z" fill="none" {...line} />
      <path d="M19 18 h26" stroke="#DCD4C3" strokeWidth="2" />
    </>
  ),
  jus: () => (
    <>
      <path d="M16 8 h32 l-4 48 h-24 z" fill="#F5EFE6" {...line} />
      <path d="M18.6 16 h26.8 l-3.4 39 h-20 z" fill="#E98A2E" />
      <path d="M16 8 h32 l-4 48 h-24 z" fill="none" {...line} />
      <circle cx="46" cy="10" r="7" fill="#F2C14E" {...line} />
      <path d="M46 4 v12 M40 10 h12" stroke="#E0A126" strokeWidth="1.4" />
      <path d="M30 2 l4 30" stroke="#26261F" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  es_jeruk: () => (
    <>
      <path d="M16 8 h32 l-4 48 h-24 z" fill="#F5EFE6" {...line} />
      <path d="M18.6 18 h26.8 l-3.2 37 h-20.4 z" fill="#F4D35E" />
      <rect x="22" y="24" width="8" height="7" rx="1.5" fill="#FFFBEA" opacity="0.85" />
      <rect x="33" y="32" width="8" height="7" rx="1.5" fill="#FFFBEA" opacity="0.85" />
      <path d="M16 8 h32 l-4 48 h-24 z" fill="none" {...line} />
      <path d="M40 8 a9 9 0 0 1 16 4 z" fill="#8DBF4A" {...line} />
    </>
  ),
  boba: () => (
    <>
      <path d="M14 16 h36 l-4 42 h-28 z" fill="#E6CBA5" {...line} />
      {[
        [22, 50],
        [29, 52],
        [36, 50],
        [42, 52],
        [25, 45],
        [33, 46],
        [40, 45],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.8" fill="#3B2618" />
      ))}
      <path d="M12 16 q20 -10 40 0 z" fill="#F1ECE2" {...line} />
      <path d="M36 2 l-4 18" stroke="#C2412D" strokeWidth="4" strokeLinecap="round" />
    </>
  ),
  kemasan: () => (
    <>
      <path d="M24 4 h16 v8 q8 4 8 14 v28 q0 6 -6 6 h-20 q-6 0 -6 -6 v-28 q0 -10 8 -14 z" fill="#C2412D" {...line} />
      <rect x="22" y="2" width="20" height="6" rx="2" fill="#26261F" />
      <rect x="18" y="28" width="28" height="16" fill="#FBF8F1" {...thin} />
      <path d="M24 36 h16" stroke="#C2412D" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),

  /* camilan */
  telur_rebus: () => (
    <>
      <path d="M10 36 q0 -22 22 -24 q22 2 22 24 q0 16 -22 16 q-22 0 -22 -16 z" fill="#FFFFFF" {...line} />
      <circle cx="32" cy="36" r="10" fill="#F2B23A" {...line} />
    </>
  ),
  yogurt: () => (
    <>
      <path d="M14 18 h36 l-5 38 h-26 z" fill="#FFFFFF" {...line} />
      <rect x="12" y="12" width="40" height="8" rx="2" fill="#8FB7C9" {...line} />
      <path d="M18 34 h28" stroke="#8FB7C9" strokeWidth="5" />
    </>
  ),
  susu: () => (
    <>
      <path d="M18 18 l6 -8 h16 l6 8 v38 h-28 z" fill="#FFFFFF" {...line} />
      <path d="M18 18 h28" {...line} />
      <rect x="22" y="28" width="20" height="16" rx="3" fill="#6E9BC4" {...thin} />
      <path d="M40 10 l4 -6" {...line} />
    </>
  ),
  kacang: () => (
    <>
      {[
        [20, 30, -20],
        [38, 26, 25],
        [30, 42, 5],
        [46, 42, -30],
        [16, 46, 40],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x - 9} ${y} q0 -6 5 -6 q4 0 4 3 q0 -3 4 -3 q5 0 5 6 q0 6 -5 6 q-4 0 -4 -3 q0 3 -4 3 q-5 0 -5 -6 z`} fill="#D6A15F" {...thin} />
        </g>
      ))}
    </>
  ),
  ubi_rebus: () => FOOD_ART.ubi(),
  gorengan: () => (
    <>
      <path d="M8 36 q-2 -10 8 -14 q2 -10 14 -8 q8 -6 16 0 q12 0 12 10 q8 6 2 14 q0 10 -12 10 q-6 6 -16 2 q-10 4 -16 -4 q-10 -2 -8 -10 z" fill="#D49038" {...line} />
      <path d="M18 30 q4 -2 6 2 M32 24 q4 -2 6 2 M26 40 q4 -2 6 2 M42 36 q3 -2 5 1" stroke="#9C5E1C" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <path d="M20 36 l6 -2 M38 30 l4 4" stroke="#6E9F4C" strokeWidth="2.4" strokeLinecap="round" />
    </>
  ),
  es_teh: () => (
    <>
      <path d="M16 8 h32 l-4 48 h-24 z" fill="#F5EFE6" {...line} />
      <path d="M18.5 20 h27 l-3 34 h-21 z" fill="#B8652C" />
      <rect x="22" y="24" width="8" height="7" rx="1.5" fill="#F2E7D8" opacity="0.8" />
      <rect x="33" y="30" width="8" height="7" rx="1.5" fill="#F2E7D8" opacity="0.8" />
      <path d="M16 8 h32 l-4 48 h-24 z" fill="none" {...line} />
      <path d="M38 4 l-6 34" stroke="#C2412D" strokeWidth="2.6" strokeLinecap="round" />
    </>
  ),
  kopi_susu: () => (
    <>
      <path d="M16 18 h32 l-4 40 h-24 z" fill="#C79B6E" {...line} />
      <path d="M17 30 h30 l-3 28 h-24 z" fill="#A87449" />
      <path d="M16 18 h32 l-4 40 h-24 z" fill="none" {...line} />
      <path d="M14 18 q18 -14 36 0 z" fill="#F1ECE2" {...line} />
      <path d="M36 4 l-4 16" stroke="#26261F" strokeWidth="3" strokeLinecap="round" />
    </>
  ),
  keripik: () => (
    <>
      <path d="M14 8 h36 l-2 6 q4 20 0 36 l2 6 h-36 l2 -6 q-4 -16 0 -36 z" fill="#C2412D" {...line} />
      <circle cx="32" cy="32" r="10" fill="#F2C14E" {...line} />
      <path d="M26 30 q6 -6 12 0 M27 35 q5 3 10 0" stroke="#C2412D" strokeWidth="1.6" fill="none" strokeLinecap="round" />
    </>
  ),
  martabak: () => (
    <>
      <path d="M8 46 l24 -34 l24 34 z" fill="#E1A452" {...line} />
      <path d="M14 38 l18 -25 l18 25" fill="none" stroke="#5B3420" strokeWidth="4" />
      <path d="M8 46 h48 v6 h-48 z" fill="#C88536" {...line} />
      <circle cx="28" cy="38" r="1.6" fill="#fff" />
      <circle cx="36" cy="34" r="1.6" fill="#fff" />
    </>
  ),
  mie_instan: () => (
    <>
      <path d="M8 34 h48 q-2 20 -24 20 q-22 0 -24 -20 z" fill="#F3EEE4" {...line} />
      <path d="M12 34 q4 -10 8 0 q4 -10 8 0 q4 -10 8 0 q4 -10 8 0 q4 -10 8 0" fill="#F0C875" {...line} />
      <path d="M40 8 l-10 26 M48 10 l-12 24" stroke="#7A4B2A" strokeWidth="2.6" strokeLinecap="round" />
      <ellipse cx="22" cy="28" rx="5" ry="3" fill="#FFFFFF" {...thin} />
      <circle cx="22" cy="28" r="1.8" fill="#F2A52B" />
    </>
  ),
};

export function FoodIcon({ id, size = 64 }: { id: string; size?: Size }) {
  const art = FOOD_ART[id] ?? FOOD_ART.nasi_putih;
  return <Svg size={size}>{art()}</Svg>;
}

export const hasFoodArt = (id: string) => id in FOOD_ART;

/* ------------------------------------------------------------------ aktivitas & tujuan */

function Person({ children }: { children: ReactNode }) {
  return <g fill="none" {...line} strokeWidth={2.6}>{children}</g>;
}

export function ActivityIcon({ kind, size = 40 }: { kind: "duduk" | "campuran" | "fisik"; size?: number }) {
  return (
    <Svg size={size}>
      {kind === "duduk" && (
        <Person>
          <circle cx="22" cy="14" r="5" fill={SKIN} />
          <path d="M22 20 l2 16 h14 v16" />
          <path d="M23 26 l14 4" />
          <path d="M10 52 h44" />
          <rect x="36" y="22" width="16" height="11" rx="1.5" fill="#D5DCE0" />
          <path d="M14 36 h10 v16" />
        </Person>
      )}
      {kind === "campuran" && (
        <Person>
          <circle cx="32" cy="10" r="5" fill={SKIN} />
          <path d="M32 16 l-2 20 l-8 18 M30 36 l8 18" />
          <path d="M31 22 l-10 10 M31 22 l10 8" />
        </Person>
      )}
      {kind === "fisik" && (
        <Person>
          <circle cx="24" cy="10" r="5" fill={SKIN} />
          <path d="M24 16 l2 20 l-8 18 M26 36 l8 18" />
          <path d="M25 22 l14 6 M25 26 l14 8" />
          <rect x="36" y="22" width="18" height="16" rx="1.5" fill="#D9B77A" />
          <path d="M36 30 h18" strokeWidth={1.6} />
        </Person>
      )}
    </Svg>
  );
}

export function GoalIcon({ kind, size = 40 }: { kind: "turun" | "jaga" | "naik" | "otot"; size?: number }) {
  return (
    <Svg size={size}>
      {kind !== "otot" && (
        <>
          <rect x="8" y="22" width="48" height="34" rx="8" fill="#F4F1EA" {...line} />
          <path d="M18 36 a14 14 0 0 1 28 0" fill="none" {...line} />
          <path
            d={kind === "turun" ? "M32 38 l-9 -8" : kind === "naik" ? "M32 38 l9 -8" : "M32 38 v-12"}
            {...line}
            stroke="#C2412D"
            strokeWidth={3}
          />
          <circle cx="32" cy="38" r="2.5" fill={INK} />
          {kind === "turun" && <path d="M48 6 v10 m-4 -4 l4 4 l4 -4" fill="none" {...line} />}
          {kind === "naik" && <path d="M48 16 v-10 m-4 4 l4 -4 l4 4" fill="none" {...line} />}
          {kind === "jaga" && <path d="M42 11 h12 M42 15 h12" fill="none" {...line} />}
        </>
      )}
      {kind === "otot" && (
        <>
          <rect x="16" y="29" width="32" height="6" rx="2" fill="#9AA0A6" {...line} />
          <rect x="6" y="18" width="8" height="28" rx="2" fill={INK} />
          <rect x="14" y="22" width="6" height="20" rx="2" fill="#555" {...line} />
          <rect x="50" y="18" width="8" height="28" rx="2" fill={INK} />
          <rect x="44" y="22" width="6" height="20" rx="2" fill="#555" {...line} />
        </>
      )}
    </Svg>
  );
}

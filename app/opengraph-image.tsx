import { ImageResponse } from "next/og";

export const alt = "Cytra — Biopharma raw materials, answered.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Latin-only copy: the default OG font has no CJK glyphs.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px 96px",
          background: "radial-gradient(circle at 25% 35%, #cdeee8 0%, transparent 45%), radial-gradient(circle at 78% 62%, #d6e2f7 0%, transparent 45%), #f4f7f8",
          color: "#16242a",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <svg width="72" height="72" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="9.25" fill="none" stroke="#16242a" strokeWidth="1.5" />
            <circle cx="14.2" cy="10" r="3.4" fill="#1f9e90" />
            <path d="M6.8 15.2c1.4 1.3 3.2 2 5.2 2" fill="none" stroke="#16242a" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 700, letterSpacing: -1.5 }}>Cytra</div>
        </div>
        <div style={{ marginTop: 48, fontSize: 76, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.05 }}>
          Biopharma raw materials,
        </div>
        <div style={{ fontSize: 76, fontWeight: 700, letterSpacing: -2.5, lineHeight: 1.05, color: "#1f8a7e" }}>answered.</div>
        <div style={{ marginTop: 40, fontSize: 28, color: "#53636a" }}>Specs · Grades · Substitutes · Documents · Suppliers</div>
      </div>
    ),
    size,
  );
}

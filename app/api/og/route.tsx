import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const title = searchParams.get("title") ?? "Osmá liga";
  const sub = searchParams.get("sub") ?? "VAR nemáme, hraj dál.";

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "linear-gradient(135deg, #052e16 0%, #0f172a 60%)",
          padding: "60px",
        }}
      >
        <div style={{ fontSize: 20, color: "#4ade80", marginBottom: 16, letterSpacing: 4, textTransform: "uppercase" }}>
          Náhoda FC uvádí
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, color: "#ffffff", textAlign: "center", lineHeight: 1.1 }}>
          {title}
        </div>
        <div style={{ fontSize: 28, color: "#86efac", marginTop: 20 }}>
          {sub}
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

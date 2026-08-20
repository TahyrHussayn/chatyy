import { ImageResponse } from "next/og";

export const alt = "Chatyy - Flow with Chat";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #7c3aed 0%, #4338ca 50%, #1e1b4b 100%)",
        fontFamily: "system-ui, sans-serif",
        padding: "60px",
        color: "white",
      }}
    >
      {/* Frosted Glass Main Card */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.12)",
          border: "1px solid rgba(255, 255, 255, 0.25)",
          borderRadius: "32px",
          padding: "50px 80px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
          textAlign: "center",
        }}
      >
        {/* Logo icon */}
        <div
          style={{
            width: "80px",
            height: "80px",
            borderRadius: "24px",
            background: "rgba(255, 255, 255, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "40px",
            marginBottom: "20px",
          }}
        >
          💬
        </div>

        <h1
          style={{
            fontSize: "64px",
            fontWeight: 800,
            letterSpacing: "-0.03em",
            margin: 0,
            marginBottom: "12px",
            textShadow: "0 4px 20px rgba(0,0,0,0.2)",
          }}
        >
          Chatyy
        </h1>

        <p
          style={{
            fontSize: "26px",
            fontWeight: 500,
            color: "rgba(255, 255, 255, 0.85)",
            margin: 0,
            marginBottom: "32px",
            maxWidth: "700px",
          }}
        >
          Flow with real-time ephemeral chat & self-destructing secret vault
        </p>

        {/* Feature Badges */}
        <div
          style={{
            display: "flex",
            gap: "16px",
          }}
        >
          <div
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "16px",
              fontWeight: 600,
              color: "white",
            }}
          >
            ⚡ Real-time SSE
          </div>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "16px",
              fontWeight: 600,
              color: "white",
            }}
          >
            🔒 Stealth Lock
          </div>
          <div
            style={{
              padding: "8px 20px",
              borderRadius: "9999px",
              background: "rgba(255, 255, 255, 0.15)",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              fontSize: "16px",
              fontWeight: 600,
              color: "white",
            }}
          >
            ⏳ Ephemeral & Vault
          </div>
        </div>
      </div>
    </div>,
    {
      ...size,
    },
  );
}

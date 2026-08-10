import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a2f5e, #0f1f42)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: "60px",
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-2px",
            lineHeight: 1,
          }}
        >
          TMS
        </span>
        <span
          style={{
            color: "#a8c0ff",
            fontSize: "16px",
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "2px",
            marginTop: "6px",
          }}
        >
          SOLUTIONS
        </span>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #d97706, #92400e)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "40px",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: "64px",
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
            color: "#fde68a",
            fontSize: "18px",
            fontWeight: 700,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "1px",
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

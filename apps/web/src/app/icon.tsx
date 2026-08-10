import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #1a2f5e, #0f1f42)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
        }}
      >
        <span
          style={{
            color: "white",
            fontSize: "12px",
            fontWeight: 900,
            fontFamily: "system-ui, sans-serif",
            letterSpacing: "-0.5px",
          }}
        >
          TMS
        </span>
      </div>
    ),
    { ...size }
  );
}

import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default async function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#1B3A4B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingLeft: 7,
          gap: 5,
        }}
      >
        <div style={{ width: 18, height: 2, background: "#F4F1EA" }} />
        <div style={{ width: 12, height: 2, background: "#F4F1EA" }} />
        <div style={{ width: 15, height: 2, background: "#F4F1EA" }} />
      </div>
    ),
    { ...size },
  );
}

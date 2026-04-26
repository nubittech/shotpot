"use client";

import { useRef, useState } from "react";

export function ScratchDemo({
  onDone,
  label
}: {
  onDone: () => void;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [started, setStarted] = useState(false);
  const [complete, setComplete] = useState(false);

  function onScratch(event: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas || complete) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, 16, 0, Math.PI * 2);
    ctx.fill();

    if (!started) setStarted(true);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let i = 3; i < imageData.length; i += 4) {
      if (imageData[i] === 0) cleared++;
    }
    const ratio = cleared / (canvas.width * canvas.height);
    if (ratio > 0.5) {
      setComplete(true);
      onDone();
    }
  }

  return (
    <div style={{ position: "relative", marginTop: 12 }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: 12,
          display: "grid",
          placeItems: "center",
          background: "#f6fff0",
          color: "#254015",
          fontWeight: 700
        }}
      >
        {label}
      </div>
      <canvas
        ref={canvasRef}
        width={560}
        height={140}
        onMouseMove={onScratch}
        style={{
          width: "100%",
          height: "140px",
          borderRadius: 12,
          background: "linear-gradient(120deg, #57514a, #39332d)"
        }}
      />
      {!started && <p className="muted">Kartin uzerini kazimaya basla.</p>}
    </div>
  );
}

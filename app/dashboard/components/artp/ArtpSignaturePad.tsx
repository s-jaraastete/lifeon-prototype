"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

interface ArtpSignaturePadProps {
  onConfirm: (dataUrl: string) => void;
  disabled?: boolean;
}

export function ArtpSignaturePad({ onConfirm, disabled }: ArtpSignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  const startDraw = (x: number, y: number) => {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (x: number, y: number) => {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    ctx?.lineTo(x, y);
    ctx?.stroke();
  };

  const endDraw = () => {
    drawing.current = false;
  };

  const pointer = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>, fn: (x: number, y: number) => void) => {
      const rect = e.currentTarget.getBoundingClientRect();
      fn(e.clientX - rect.left, e.clientY - rect.top);
    },
    []
  );

  const clear = () => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    ctx?.clearRect(0, 0, c.width, c.height);
  };

  const confirm = () => {
    const c = canvasRef.current;
    if (!c) return;
    onConfirm(c.toDataURL("image/png"));
  };

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    c.width = c.offsetWidth * 2;
    c.height = c.offsetHeight * 2;
    const ctx = c.getContext("2d");
    if (ctx) ctx.scale(2, 2);
  }, []);

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-gray-700">Registro digital de toma de conocimiento</p>
      <canvas
        ref={canvasRef}
        className={clsx(
          "w-full h-40 rounded-xl border-2 border-dashed border-gray-300 bg-white touch-none",
          disabled && "opacity-50 pointer-events-none"
        )}
        onPointerDown={(e) => pointer(e, startDraw)}
        onPointerMove={(e) => pointer(e, draw)}
        onPointerUp={endDraw}
        onPointerLeave={endDraw}
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clear}
          className="rounded-xl border border-gray-200 px-4 py-2 text-sm"
        >
          Limpiar
        </button>
        <button
          type="button"
          onClick={confirm}
          disabled={disabled}
          className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Confirmar firma
        </button>
      </div>
    </div>
  );
}

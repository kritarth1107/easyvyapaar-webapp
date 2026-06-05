"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type InvoiceSignatureDrawModalProps = {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
};

export function InvoiceSignatureDrawModal({
  open,
  onClose,
  onSave,
}: InvoiceSignatureDrawModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const getCtx = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    return ctx;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [getCtx]);

  useEffect(() => {
    if (!open) return;
    clearCanvas();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, clearCanvas]);

  const pointerPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = getCtx();
    if (!ctx) return;
    drawing.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    canvasRef.current?.setPointerCapture(e.pointerId);
  };

  const draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current) return;
    const ctx = getCtx();
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const endDraw = (e: React.PointerEvent<HTMLCanvasElement>) => {
    drawing.current = false;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const save = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
    onClose();
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-xl border border-slate-200/90 bg-white p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
        aria-labelledby="draw-signature-title"
      >
        <h2 id="draw-signature-title" className="text-base font-bold text-brand-primary">
          Draw Signature
        </h2>
        <p className="mt-1 text-sm text-brand-primary-muted">
          Sign with your mouse or finger in the box below.
        </p>
        <canvas
          ref={canvasRef}
          width={400}
          height={150}
          className="mt-4 w-full touch-none rounded-md border border-slate-200 bg-white"
          onPointerDown={startDraw}
          onPointerMove={draw}
          onPointerUp={endDraw}
          onPointerLeave={endDraw}
        />
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={clearCanvas}
            className="rounded-md border border-slate-200/90 px-3 py-2 text-sm font-medium text-brand-primary-mid hover:bg-slate-50"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-200/90 px-3 py-2 text-sm font-medium text-brand-primary-mid hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            className="rounded-md bg-gradient-to-r from-brand-primary to-brand-primary-light px-4 py-2 text-sm font-semibold text-white hover:brightness-110"
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

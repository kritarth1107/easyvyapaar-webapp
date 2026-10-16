"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

/** Renders the e-Invoice signed QR (IRP SignedQRCode JWT) as an image. */
export function SignedQrImage({
  value,
  size = 132,
  alt = "e-Invoice QR",
  className = "",
}: {
  value?: string | null;
  size?: number;
  alt?: string;
  className?: string;
}) {
  const [rendered, setRendered] = useState<{ value: string; url: string | null } | null>(null);

  useEffect(() => {
    if (!value) return;
    let cancelled = false;
    QRCode.toDataURL(value, { errorCorrectionLevel: "M", margin: 1, width: size * 2 })
      .then((url) => {
        if (!cancelled) setRendered({ value, url });
      })
      .catch(() => {
        if (!cancelled) setRendered({ value, url: null });
      });
    return () => {
      cancelled = true;
    };
  }, [value, size]);

  const url = rendered && rendered.value === value ? rendered.url : null;
  if (!value || !url) return null;
  // eslint-disable-next-line @next/next/no-img-element -- data URL, no optimisation possible
  return <img src={url} width={size} height={size} alt={alt} className={className} />;
}

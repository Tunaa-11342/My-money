"use client";

import { useEffect, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

interface QRScannerProps {
  onResult: (result: string) => void;
}

export function QRScanner({ onResult }: QRScannerProps) {
  const scannerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("mediaDevices" in navigator)) {
      console.warn("Camera API not supported in this browser.");
      return;
    }
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        onResult(decodedText);
        scanner.clear().catch(console.error);
      },
      (error) => console.warn("QR Error:", error)
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [onResult]);

  return (
    <div
      id="qr-reader"
      ref={scannerRef}
      className="rounded-2xl border shadow-md overflow-hidden w-[260px] h-[260px] mx-auto"
    />
  );
}

import { useEffect, useRef } from 'react';

interface BarcodeScannerOptions {
  onScan: (barcode: string) => void;
  onF2?: () => void;
  onF4?: () => void;
  onF8?: () => void;
  onF9?: () => void;
  onEscape?: () => void;
  minBarcodeLength?: number;
  maxIntervalMs?: number;
}

export function useBarcodeScanner({
  onScan,
  onF2,
  onF4,
  onF8,
  onF9,
  onEscape,
  minBarcodeLength = 3,
  maxIntervalMs = 60,
}: BarcodeScannerOptions) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Function keys shortcuts
      if (e.key === 'F2') {
        e.preventDefault();
        onF2?.();
        return;
      }
      if (e.key === 'F4') {
        e.preventDefault();
        onF4?.();
        return;
      }
      if (e.key === 'F8') {
        e.preventDefault();
        onF8?.();
        return;
      }
      if (e.key === 'F9') {
        e.preventDefault();
        onF9?.();
        return;
      }
      if (e.key === 'Escape') {
        onEscape?.();
        return;
      }

      // Barcode hardware scanner detection
      const target = e.target as HTMLElement;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      const now = Date.now();
      const interval = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // When Enter is pressed, evaluate if we accumulated a rapid barcode burst
      if (e.key === 'Enter') {
        if (bufferRef.current.length >= minBarcodeLength) {
          const barcode = bufferRef.current.trim();
          bufferRef.current = '';
          // If scanner scanned, prevent form submit and invoke scan handler
          e.preventDefault();
          onScan(barcode);
          return;
        }
        bufferRef.current = '';
        return;
      }

      // If user is typing manually slowly in an input, reset buffer
      if (interval > maxIntervalMs) {
        bufferRef.current = '';
      }

      // Only accumulate printable single characters
      if (e.key.length === 1) {
        // If not in input, always capture
        // If in input, only capture if characters arrive ultra-fast (typical barcode reader: <50ms between keys)
        if (!isInput || interval < maxIntervalMs) {
          bufferRef.current += e.key;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onScan, onF2, onF4, onF8, onF9, onEscape, minBarcodeLength, maxIntervalMs]);
}

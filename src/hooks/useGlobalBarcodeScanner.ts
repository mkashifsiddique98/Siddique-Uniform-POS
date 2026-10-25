import { useEffect, useRef } from 'react';

interface Options {
  onScan: (barcode: string) => void;
  inputId?: string; // ID of the visible input element to sync with
  minChars?: number;
  maxIntervalMs?: number;
}

export function useGlobalBarcodeScanner({
  onScan,
  inputId,
  minChars = 3,
  maxIntervalMs = 50,
}: Options) {
  const bufferRef = useRef<string>('');
  const lastKeyTimeRef = useRef<number>(0);
  // Keep the latest callback in a ref so the listener is not re-attached on every render
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;

      // Allow typing if user is manually focused on an input other than our scanner input
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        // If focused directly in our barcode input, let standard typing/Enter key work
        if (inputId && target.id === inputId) {
          return;
        }
        // Ignore keypresses when user is typing in other text fields (e.g. Customer search)
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTimeRef.current;
      lastKeyTimeRef.current = currentTime;

      // Scanner completion trigger (Enter key)
      if (e.key === 'Enter') {
        const scannedCode = bufferRef.current.trim();
        if (scannedCode.length >= minChars) {
          e.preventDefault();

          // Sync visually with the input box if provided
          if (inputId) {
            const inputEl = document.getElementById(inputId) as HTMLInputElement;
            if (inputEl) {
              inputEl.value = scannedCode;
              inputEl.focus();
            }
          }

          onScanRef.current(scannedCode);
        }
        bufferRef.current = '';
        return;
      }

      // If keypress interval is long, it's human typing—reset buffer
      if (timeDiff > maxIntervalMs && bufferRef.current.length > 0) {
        bufferRef.current = '';
      }

      // Append character to buffer
      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inputId, minChars, maxIntervalMs]);
}
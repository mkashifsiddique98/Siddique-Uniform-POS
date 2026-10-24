// hooks/useBarcodeScanner.ts
import { useEffect, useRef } from 'react';

export function useBarcodeScanner(onScan: (code: string) => void) {
  const bufferRef = useRef<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Barcode scanners type characters rapidly (usually < 30ms apart)
      if (e.key === 'Enter') {
        if (bufferRef.current.length > 0) {
          onScan(bufferRef.current);
          bufferRef.current = '';
        }
        return;
      }

      // Ignore modifier keys
      if (e.key.length === 1) {
        bufferRef.current += e.key;

        // Reset buffer if user is typing manually on a standard keyboard
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          bufferRef.current = '';
        }, 100);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onScan]);
}
// hooks/useLocalScanner.ts
import { useState, useCallback } from 'react';
// Pulls from .env.local, defaults to 8080 if not set
const BRIDGE_URL = process.env.NEXT_PUBLIC_SCANNER_BRIDGE_URL || 'http://localhost:8080';
export function useLocalScanner(bridgeUrl = BRIDGE_URL) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBridgeConnected, setIsBridgeConnected] = useState<boolean | null>(null);

  // Check if the local bridge companion app is running
  const checkBridgeStatus = useCallback(async () => {
    try {
      const res = await fetch(`${bridgeUrl}/health`, { method: 'GET' });
      setIsBridgeConnected(res.ok);
      return res.ok;
    } catch {
      setIsBridgeConnected(false);
      return false;
    }
  }, [bridgeUrl]);

  // Trigger the physical scan
  const scanDocument = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${bridgeUrl}/api/scan`, { method: 'POST' });
      if (!response.ok) throw new Error('Scanner hardware reported an error.');
      
      const data = await response.json();
      return data.image; // Expecting Base64 string or Blob URL from your bridge
    } catch (err: any) {
      setError(err.message || 'Failed to connect to scanner bridge.');
      return null;
    } finally {
      setLoading(false);
    }
  }, [bridgeUrl]);

  return { scanDocument, checkBridgeStatus, isBridgeConnected, loading, error };
}
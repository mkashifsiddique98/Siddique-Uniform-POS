// components/ScannerConsole.tsx
'use client';

import { useEffect, useState } from 'react';
import { useLocalScanner } from '@/hooks/useLocalScanner';

export default function ScannerConsole() {
  const { scanDocument, checkBridgeStatus, isBridgeConnected, loading, error } = useLocalScanner();
  const [documentPreview, setDocumentPreview] = useState<string | null>(null);

  // Check if the local background app is running immediately on mount
  useEffect(() => {
    checkBridgeStatus();
  }, [checkBridgeStatus]);

  const handleScan = async () => {
    const imageResult = await scanDocument();
    if (imageResult) {
      setDocumentPreview(imageResult);
    }
  };

  if (isBridgeConnected === false) {
    return (
      <div className="p-4 border border-amber-300 bg-amber-50 rounded-md text-amber-900">
        <h3 className="font-semibold">Scanner Companion App Not Detected</h3>
        <p className="text-sm mt-1">Please ensure your local hardware bridge application is running in the background.</p>
        <button 
          onClick={checkBridgeStatus}
          className="mt-3 px-3 py-1.5 bg-amber-600 text-white rounded text-sm hover:bg-amber-700"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto bg-white shadow rounded-lg border space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800">Hardware Control</h2>
        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full font-medium">
          Bridge Connected
        </span>
      </div>

      <button
        onClick={handleScan}
        disabled={loading || isBridgeConnected === null}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-4 rounded-md disabled:bg-gray-300 transition"
      >
        {loading ? 'Processing Hardware Scan...' : 'Trigger Scan'}
      </button>

      {error && <p className="text-sm text-red-600 font-medium">{error}</p>}

      {documentPreview && (
        <div className="mt-4 border p-2 rounded-md bg-gray-50">
          <p className="text-xs text-gray-500 mb-2 font-mono">Output Result:</p>
          <img src={documentPreview} alt="Scanned Page" className="w-full max-h-96 object-contain rounded" />
        </div>
      )}
    </div>
  );
}
// // app/dashboard/scanner/page.tsx
// import dynamic from 'next/dynamic';
 "use client"
import { useState } from "react";

// // Disable Server-Side Rendering for this control console
// const ScannerConsole = dynamic(
//   () => import('@/components/ScannerConsole'),
//   { ssr: false }
// );

// export default function ScannerPage() {
//   return (
//     <main className="min-h-screen bg-gray-50 p-8">
//       <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Document Digitization Portal</h1>
//       <ScannerConsole />
      
//     </main>
//   );
// }
export default function BarcodePage() {
  const [barcode, setBarcode] = useState('');

  return (
    <div style={{ padding: 20 }}>
      <label>Scan Barcode Here:</label>
      <input
        type="text"
        autoFocus
        value={barcode}
        onChange={(e) => setBarcode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            console.log('Scanned Barcode:', barcode);
            // Submit to your database or backend API
          }
        }}
      />
    </div>
  );
}
"use client";

import { Download, FileSpreadsheet, FileCode, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface DownloadButtonProps {
  data: Array<Record<string, any>>;
  filename?: string;
  title?: string;
}

export function DownloadButton({
  data,
  filename = "report",
  title = "Dashboard Export Report",
}: DownloadButtonProps) {
  if (!data) data = [];

  // 1. Export as CSV
  const handleDownloadCSV = () => {
    if (!data.length) return alert("No data available to export");

    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((item) =>
      Object.values(item)
        .map((val) => `"${String(val ?? "").replace(/"/g, '""')}"`)
        .join(",")
    );

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);

    triggerDownload(encodedUri, `${filename}.csv`);
  };

  // 2. Export as JSON
  const handleDownloadJSON = () => {
    if (!data.length) return alert("No data available to export");

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(data, null, 2)
    )}`;

    triggerDownload(jsonString, `${filename}.json`);
  };

  // 3. Export as PDF (Browser Print Document View)
  const handleDownloadPDF = () => {
    if (!data.length) return alert("No data available to export");

    const headers = Object.keys(data[0]);
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      alert("Please allow popups to generate the PDF report.");
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { margin-bottom: 5px; }
            p { font-size: 12px; color: #666; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; word-break: break-all; }
            th { background-color: #f4f4f4; font-weight: bold; }
            tr:nth-child(even) { background-color: #f9f9f9; }
            @media print {
              body { padding: 0; }
            }
          </style>
        </head>
        <body>
          <h2>${title}</h2>
          <p>Generated on: ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr>
                ${headers.map((h) => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${data
                .map(
                  (row) => `
                <tr>
                  ${headers
                    .map(
                      (h) =>
                        `<td>${
                          typeof row[h] === "object"
                            ? JSON.stringify(row[h])
                            : row[h] ?? ""
                        }</td>`
                    )
                    .join("")}
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // Helper trigger
  const triggerDownload = (uri: string, downloadName: string) => {
    const link = document.createElement("a");
    link.setAttribute("href", uri);
    link.setAttribute("download", downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Export Data
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Choose Format</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleDownloadCSV} className="cursor-pointer">
          <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
          <span>Export CSV</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDownloadPDF} className="cursor-pointer">
          <FileText className="mr-2 h-4 w-4 text-red-600" />
          <span>Export PDF / Print</span>
        </DropdownMenuItem>

        <DropdownMenuItem onClick={handleDownloadJSON} className="cursor-pointer">
          <FileCode className="mr-2 h-4 w-4 text-blue-600" />
          <span>Export JSON</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
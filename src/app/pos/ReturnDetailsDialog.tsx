"use client";

import { canonicalizeLines } from "@/lib/posHelpers";
import { formatReturnTime } from "@/lib/formatTime";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type Line = { productName: string; sellPrice?: number; returns?: any[]; [key: string]: any };

// Red badge on a line with returns. Click it to open the return details.
export function ReturnBadge({ count, onClick }: { count: number; onClick: () => void }) {
  if (!(count > 0)) return null;
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-2 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-xs font-semibold text-red-700 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
      aria-label={`Returned ${count}, show return details`}
    >
      Returned {count}
    </button>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Saved invoice lines (any shape; legacy return lines are merged the same way as on the server)
  lines: Line[];
  // Entries returned at or after this time are highlighted (the return that was just saved)
  highlightFrom?: string | number | Date | null;
  // When given, active entries get a Cancel button. Indexes match canonicalizeLines(lines).
  onCancelReturn?: (lineIndex: number, returnIndex: number) => void;
}

// Closes with the button, Escape or a click outside; focus goes back to the previous element (Radix Dialog).
export default function ReturnDetailsDialog({ open, onOpenChange, lines, highlightFrom, onCancelReturn }: Props) {
  const canonical = canonicalizeLines(lines as any[]) as Line[];
  const highlightMs = highlightFrom ? new Date(highlightFrom).getTime() : null;

  const rows = canonical.flatMap((line, lineIndex) =>
    line.mode === "return"
      ? // Old return line with no sale line on this invoice: shown as one entry, no time, cannot be cancelled
        [
          {
            line,
            lineIndex,
            returnIndex: -1,
            orphan: true,
            entry: { qty: line.quantity, reason: line.returnReason, refundAmount: Number(line.quantity) * (Number(line.sellPrice) || 0) } as any,
          },
        ]
      : (line.returns || []).map((entry: any, returnIndex: number) => ({ line, entry, lineIndex, returnIndex, orphan: false }))
  );
  const totalRefunded = rows.reduce(
    (sum, { line, entry }) =>
      entry.cancelled ? sum : sum + (Number(entry.refundAmount) || Number(entry.qty) * (Number(line.sellPrice) || 0)),
    0
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] border-2 border-red-500 p-0 overflow-hidden">
        <DialogHeader className="bg-red-600 text-white px-6 py-4">
          <DialogTitle>Return details</DialogTitle>
          <DialogDescription className="text-red-100">Every return with the time it was recorded.</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-2 max-h-[60vh] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date and time</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Qty returned</TableHead>
                <TableHead>Refund</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>User</TableHead>
                {onCancelReturn && <TableHead />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ line, entry, lineIndex, returnIndex, orphan }) => {
                const at = entry.at ? new Date(entry.at).getTime() : null;
                const isNew = highlightMs !== null && at !== null && at >= highlightMs && !entry.cancelled;
                const refund = Number(entry.refundAmount) || Number(entry.qty) * (Number(line.sellPrice) || 0);
                return (
                  <TableRow
                    key={`${lineIndex}-${returnIndex}`}
                    className={`${entry.cancelled ? "line-through text-gray-400" : ""} ${isNew ? "bg-red-50 font-semibold" : ""}`}
                  >
                    <TableCell className="min-w-[170px]">{formatReturnTime(entry.at)}</TableCell>
                    <TableCell>
                      {line.productName}
                      {orphan && (
                        <span className="ml-2 rounded-full bg-red-100 border border-red-300 px-2 py-0.5 text-xs font-semibold text-red-700">
                          Returned
                        </span>
                      )}
                    </TableCell>
                    <TableCell>{entry.qty}</TableCell>
                    <TableCell>Rs {refund}</TableCell>
                    <TableCell>{entry.reason || "-"}</TableCell>
                    <TableCell>{entry.user || "-"}</TableCell>
                    {onCancelReturn && (
                      <TableCell>
                        {!entry.cancelled && !orphan && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-red-300 text-red-700"
                            onClick={() => onCancelReturn(lineIndex, returnIndex)}
                          >
                            Cancel return
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={onCancelReturn ? 7 : 6} className="text-center text-gray-500">
                    No returns on this invoice.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <DialogFooter className="px-6 pb-4 sm:justify-between items-center">
          <p className="font-bold text-red-600">Total refunded: Rs {totalRefunded}</p>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { NextResponse } from "next/server";
import connectDB from "@/utils/connectDB";
import Invoice from "@/models/invoice";
import { requireAuth } from "@/lib/auth";
import { wholesaleCustomerInvoicesFilter } from "@/lib/customerData";

connectDB();

// Wholesale customers are grouped from invoice snapshots; no separate customer or supplier records.
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;

  try {
    const search = (new URL(request.url).searchParams.get("search") || "").trim().slice(0, 100);
    const invoiceMatch: Record<string, unknown> = wholesaleCustomerInvoicesFilter();
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      invoiceMatch.$or = [
        { "customer.customerName": { $regex: escaped, $options: "i" } },
        { "customer.schoolName": { $regex: escaped, $options: "i" } },
      ];
    }
    const rows = await Invoice.aggregate([
      { $match: invoiceMatch },
      { $sort: { invoiceDate: -1, _id: -1 } },
      {
        $group: {
          _id: "$customer._id",
          name: { $first: "$customer.customerName" },
          schoolName: { $first: "$customer.schoolName" },
          phone: { $first: "$customer.phone" },
          prevBalance: { $first: "$customer.prevBalance" },
          invoiceCount: { $sum: 1 },
          lastInvoiceDate: { $max: "$invoiceDate" },
          total: { $sum: "$grandTotal" },
        },
      },
      { $sort: { name: 1, _id: 1 } },
    ]);

    return NextResponse.json({
      rows: rows.filter((row) => row._id).map((row) => ({
        id: String(row._id),
        name: row.name || "",
        schoolName: row.schoolName || "",
        phone: row.phone ?? null,
        prevBalance: Number(row.prevBalance || 0),
        invoiceCount: Number(row.invoiceCount || 0),
        totalInvoiced: Number(row.total || 0),
        lastInvoiceDate: row.lastInvoiceDate || null,
      })),
    });
  } catch (error) {
    console.error("Wholesale customers list error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

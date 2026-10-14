import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "@/utils/connectDB";
import Wholesaler from "@/models/wholesaler";
import Invoice from "@/models/invoice";
import { requireAuth } from "@/lib/auth";
import { buildCustomerInvoiceLedger } from "@/lib/wholesalerLedger";
import { normalizeIdentity } from "@/lib/wholesalerData";
import { wholesalerHistoryQuerySchema } from "@/validation/wholesalers";

connectDB();

type InvoiceLine = {
  productName?: string;
  quantity?: number;
  sellPrice?: number;
  return?: boolean;
};

type InvoiceRecord = {
  _id: unknown;
  invoiceNo?: number;
  customer?: {
    customerName?: string;
    schoolName?: string;
    phone?: number;
  };
  productDetail?: InvoiceLine[];
  grandTotal?: number;
  prevBalance?: number;
  invoiceDate?: Date | string;
  status?: string;
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function identityKey(customer: InvoiceRecord["customer"]): string {
  return [customer?.phone, customer?.customerName, customer?.schoolName]
    .map((value) => normalizeIdentity(value))
    .join("|");
}

function toLedgerRecord(invoice: InvoiceRecord) {
  return {
    id: String(invoice._id),
    date: invoice.invoiceDate || new Date(0),
    reference: String(invoice.invoiceNo || invoice._id),
    grandTotal: Number(invoice.grandTotal || 0),
    prevBalance: Number(invoice.prevBalance || 0),
    lines: invoice.productDetail || [],
  };
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  if (!mongoose.isValidObjectId(params.id)) {
    return NextResponse.json({ error: "Invalid wholesaler ID" }, { status: 400 });
  }

  const parsedQuery = wholesalerHistoryQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams.entries())
  );
  if (!parsedQuery.success) {
    return NextResponse.json({ error: parsedQuery.error.issues[0]?.message || "Invalid query" }, { status: 400 });
  }

  try {
    const wholesaler = await Wholesaler.findById(params.id).lean();
    if (!wholesaler) return NextResponse.json({ error: "Wholesaler not found" }, { status: 404 });

    const phone = normalizeIdentity(wholesaler.phone);
    const numericPhone = phone && /^\d+$/.test(phone) && Number(phone) > 0 ? Number(phone) : null;
    const nameRegex = new RegExp(`^${escapeRegex(wholesaler.name.trim())}$`, "i");
    const projection = "_id invoiceNo customer productDetail grandTotal prevBalance invoiceDate status";
    const phoneCandidates = numericPhone
      ? await Invoice.find({ "customer.phone": numericPhone }).select("customer").lean()
      : [];
    const match = phoneCandidates.length > 0
      ? { "customer.phone": numericPhone }
      : { "customer.customerName": nameRegex };
    const candidates = phoneCandidates.length > 0
      ? phoneCandidates
      : await Invoice.find(match).select("customer").lean();
    const identities = new Set(candidates.map((invoice) => identityKey(invoice.customer as InvoiceRecord["customer"])));

    if (identities.size > 1) {
      return NextResponse.json({
        rows: [],
        totals: { sales: 0, returns: 0, netSales: 0, outstanding: 0, payments: 0 },
        pagination: { page: parsedQuery.data.page, limit: parsedQuery.data.limit, total: 0, pages: 0 },
        matching: {
          method: phoneCandidates.length > 0 ? "phone" : "name",
          ambiguous: true,
          candidateCount: identities.size,
          note: "Multiple invoice customer identities matched this wholesaler; no invoice rows were merged.",
        },
        dataGaps: ["No customer reference is stored on invoices", "No payment amount or payment collection exists", "Return rows exist only when invoice lines retain return=true"],
      });
    }

    const { from, to, type, page, limit } = parsedQuery.data;
    const dateMatch: Record<string, unknown> = { ...match };
    if (from || to) {
      const invoiceDate: Record<string, Date> = {};
      if (from) invoiceDate.$gte = new Date(from);
      if (to) invoiceDate.$lte = new Date(to);
      dateMatch.invoiceDate = invoiceDate;
    }
    const beforeMatch: Record<string, unknown> = { ...match };
    if (from) beforeMatch.invoiceDate = { $lt: new Date(from) };

    const [invoices, total, beforeInvoices] = await Promise.all([
      Invoice.find(dateMatch).select(projection).sort({ invoiceDate: 1, _id: 1 }).skip((page - 1) * limit).limit(limit).lean(),
      Invoice.countDocuments(dateMatch),
      from ? Invoice.find(beforeMatch).select(projection).sort({ invoiceDate: 1, _id: 1 }).lean() : Promise.resolve([]),
    ]);
    const pageOffset = (page - 1) * limit;
    const previousPageInvoices = pageOffset > 0
      ? await Invoice.find(dateMatch).select(projection).sort({ invoiceDate: 1, _id: 1 }).limit(pageOffset).lean()
      : [];
    const openingLedger = buildCustomerInvoiceLedger([
      ...(beforeInvoices as unknown as InvoiceRecord[]),
      ...(previousPageInvoices as unknown as InvoiceRecord[]),
    ].map(toLedgerRecord));
    const invoiceLedger = buildCustomerInvoiceLedger((invoices as unknown as InvoiceRecord[]).map(toLedgerRecord), openingLedger.totals.outstanding);
    const rows = type === "all" ? invoiceLedger.rows : invoiceLedger.rows.filter((row: { type: string }) => row.type === type);

    return NextResponse.json({
      rows,
      totals: invoiceLedger.totals,
      openingBalance: openingLedger.totals.outstanding,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      matching: {
        method: phoneCandidates.length > 0 ? "phone" : "name",
        ambiguous: false,
        candidateCount: identities.size,
        note: phoneCandidates.length > 0 ? "Matched by normalized phone." : "Matched by normalized name; no customer reference or school-name link exists.",
      },
      dataGaps: ["Payments are unavailable because received amounts are not persisted", "Returns are unavailable for historical returns whose invoice lines do not retain return=true"],
    });
  } catch (error) {
    console.error("Wholesaler sales history error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

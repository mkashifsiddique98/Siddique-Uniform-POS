import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { effectiveOversellMode, getGlobalOversellMode } from "@/lib/oversell";

connectDB();

// Stock only: the POS polls this instead of re-fetching the full product list.
// `oversellMode` is resolved the same way as in GET /api/product.
export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
  try {
    const [products, globalMode] = await Promise.all([
      Product.find({}, { quantity: 1, oversellMode: 1 }).lean(),
      getGlobalOversellMode(),
    ]);
    const response = products.map((product: any) => ({
      _id: String(product._id),
      quantity: product.quantity ?? 0,
      oversellMode: effectiveOversellMode(product.oversellMode, globalMode),
    }));
    return Response.json({ response }, { status: 200, headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

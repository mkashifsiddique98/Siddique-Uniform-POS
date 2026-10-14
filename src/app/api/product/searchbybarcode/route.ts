import Product from '@/models/Product';
import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { effectiveOversellMode, getGlobalOversellMode } from '@/lib/oversell';

export async function POST(req: Request) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  try {
    const { barcode } = await req.json();
    // Query your database for product matching barcode/SKU
    const product = await Product.findOne({ productCode:barcode }).lean();
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const oversellMode = effectiveOversellMode((product as any).oversellMode, await getGlobalOversellMode());
    return NextResponse.json({ product: { ...product, oversellMode } });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
import Product from '@/models/Product';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { barcode } = await req.json();
     console.log("barcode : ",barcode)
    // Query your database for product matching barcode/SKU
    const product = await Product.findOne({ productCode:barcode });
      console.log("product : ",product)
    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json({ product });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
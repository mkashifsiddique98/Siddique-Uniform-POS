import { NextResponse } from "next/server";
import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { requireAuth } from "@/lib/auth";

// Legacy route: moves stock outside the invoice service. Kept admin-only until it is removed in the data-integrity phase.
export async function PUT(request: Request) {
  await connectDB();

  const auth = await requireAuth(request, { role: "admin" });
  if (!auth.ok) return auth.response;

  try {
    const { products } = await request.json();

    if (!Array.isArray(products)) {
      throw new Error("Invalid request format. Expected array.");
    }

    const results = [];

    for (const productData of products) {
      const { productId, quantity, mode } = productData;
      const normalizedQuantity = Number(quantity || 0);
      const actionMode = String(mode || "sale").toLowerCase();

      if (!productId || !Number.isFinite(normalizedQuantity)) {
        throw new Error(`Invalid product data for ${productId}`);
      }

      const product = await Product.findById(productId);

      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

      const delta = actionMode === "return" ? Math.abs(normalizedQuantity) : -Math.abs(normalizedQuantity);

      if (product.isBundle && Array.isArray(product.components)) {
        for (const componentId of product.components) {
          const component = await Product.findById(componentId);

          if (!component) {
            throw new Error(`Component not found: ${componentId}`);
          }

          const updatedComponent = await Product.findOneAndUpdate(
            {
              _id: componentId,
              quantity: { $gte: Math.abs(delta) },
            },
            { $inc: { quantity: delta } },
            { new: true }
          );

          if (!updatedComponent) {
            throw new Error(`Insufficient stock for component ${componentId}`);
          }
        }

        results.push({ bundleProduct: productId, mode: actionMode, quantity: normalizedQuantity });
        continue;
      }

      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          quantity: { $gte: actionMode === "return" ? 0 : Math.abs(normalizedQuantity) },
        },
        { $inc: { quantity: delta } },
        { new: true }
      );

      if (!updatedProduct) {
        throw new Error(`Insufficient stock for ${productId}`);
      }

      results.push({ productId, mode: actionMode, quantity: normalizedQuantity });
    }

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
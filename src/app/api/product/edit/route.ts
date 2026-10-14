<<<<<<< HEAD
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
=======
import mongoose from "mongoose";
import { NextResponse } from "next/server";
import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";

export async function PUT(request: Request) {
  await connectDB();

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { mode, products } = await request.json();
    const isReturn = mode === "return";
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

    if (!Array.isArray(products)) {
      throw new Error("Invalid request format. Expected array.");
    }

    const results = [];

    for (const productData of products) {
<<<<<<< HEAD
      const { productId, quantity, mode } = productData;
      const normalizedQuantity = Number(quantity || 0);
      const actionMode = String(mode || "sale").toLowerCase();

      if (!productId || !Number.isFinite(normalizedQuantity)) {
        throw new Error(`Invalid product data for ${productId}`);
      }

      const product = await Product.findById(productId);

=======
      const { productId, quantity } = productData;

      if (!productId || typeof quantity !== "number") {
        throw new Error(`Invalid product data for ${productId}`);
      }

      const product = await Product.findById(productId).session(session);
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

<<<<<<< HEAD
      const delta = actionMode === "return" ? Math.abs(normalizedQuantity) : -Math.abs(normalizedQuantity);

      if (product.isBundle && Array.isArray(product.components)) {
        for (const componentId of product.components) {
          const component = await Product.findById(componentId);
=======
      // -----------------------
      // RETURN CASE
      // -----------------------

      if (isReturn) {
        const updated = await Product.findByIdAndUpdate(
          productId,
          { $inc: { quantity: quantity } },
          { new: true, session },
        );

        results.push(updated);
        continue;
      }

      // -----------------------
      // BUNDLE PRODUCT
      // -----------------------
      
      if (product.isBundle && Array.isArray(product.components)) {
        for (const componentId of product.components) {
          const component = await Product.findById(componentId).session(
            session,
          );
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

          if (!component) {
            throw new Error(`Component not found: ${componentId}`);
          }

<<<<<<< HEAD
          const updatedComponent = await Product.findOneAndUpdate(
            {
              _id: componentId,
              quantity: { $gte: Math.abs(delta) },
            },
            { $inc: { quantity: delta } },
            { new: true }
=======
          // Atomic stock check
          const updatedComponent = await Product.findOneAndUpdate(
            {
              _id: componentId,
              quantity: { $gte: quantity }, // prevents negative stock
            },
            { $inc: { quantity: -quantity } },
            { new: true, session },
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
          );

          if (!updatedComponent) {
            throw new Error(`Insufficient stock for component ${componentId}`);
          }
        }

<<<<<<< HEAD
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
=======
        results.push({ bundleProduct: productId });
        continue;
      }

      // -----------------------
      // NORMAL PRODUCT
      // -----------------------
      const updatedProduct = await Product.findOneAndUpdate(
        {
          _id: productId,
          quantity: { $gte: quantity }, // atomic condition
        },
        { $inc: { quantity: -quantity } },
        { new: true, session },
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      );

      if (!updatedProduct) {
        throw new Error(`Insufficient stock for ${productId}`);
      }

<<<<<<< HEAD
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
=======
      results.push(updatedProduct);
    }

    // If all success → commit
    await session.commitTransaction();
    session.endSession();

    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error: any) {
    // If any error → rollback
    await session.abortTransaction();
    session.endSession();

    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 },
    );
  }
}
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

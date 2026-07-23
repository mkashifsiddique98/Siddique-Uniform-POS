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

    if (!Array.isArray(products)) {
      throw new Error("Invalid request format. Expected array.");
    }

    const results = [];

    for (const productData of products) {
      const { productId, quantity } = productData;

      if (!productId || typeof quantity !== "number") {
        throw new Error(`Invalid product data for ${productId}`);
      }

      const product = await Product.findById(productId).session(session);
      if (!product) {
        throw new Error(`Product not found: ${productId}`);
      }

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

          if (!component) {
            throw new Error(`Component not found: ${componentId}`);
          }

          // Atomic stock check
          const updatedComponent = await Product.findOneAndUpdate(
            {
              _id: componentId,
              quantity: { $gte: quantity }, // prevents negative stock
            },
            { $inc: { quantity: -quantity } },
            { new: true, session },
          );

          if (!updatedComponent) {
            throw new Error(`Insufficient stock for component ${componentId}`);
          }
        }

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
      );

      if (!updatedProduct) {
        throw new Error(`Insufficient stock for ${productId}`);
      }

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

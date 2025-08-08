import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { ProductFormState } from "@/types/product";

connectDB(); // Connect to MongoDB
// Create New Product
// POS Page : Qty - Function    
// ***********************************************************
// ***********************************************************
//               We can Manage POS Functionality Here
// ***********************************************************

export async function PUT(request: Request) {
  try {
    const productsToUpdate = await request.json();
   
    if (!Array.isArray(productsToUpdate)) {
      return NextResponse.json(
        { error: "Invalid request format. Expected an array of products." },
        { status: 400 }
      );
    }

    const updatedProducts = await Promise.all(
      productsToUpdate.map(async (productData) => {
        const { productId, quantity, return: isReturn } = productData;

        if (!productId || typeof quantity !== "number") {
          return { error: `Invalid product data for productId: ${productId}` };
        }

        const product = await Product.findOne({ _id: productId });
        if (!product) {
          return null; // Skip if not found
        }

        if (isReturn) {
          // Return case — just increase quantity
          return await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { quantity: quantity } },
            { new: true }
          );
        }

        // --- Handle BUNDLE PRODUCTS ---
        if (product.isBundle && Array.isArray(product.components)) {
          const updatedComponents = await Promise.all(
            product.components.map(async (componentId: string) => {
              const component:ProductFormState = await Product.findOne({ _id: componentId });
              if (!component) {
                return { error: `Component product not found: ${componentId}` };
              }

              // Check for stock
              if (component.quantity < quantity) {
                return {
                  error: `Insufficient stock for component ID ${componentId}. Required: ${quantity}, Available: ${component.quantity}`
                };
              }

              // Reduce component quantity
              return await Product.findOneAndUpdate(
                { _id: componentId },
                { $inc: { quantity: -quantity } },
                { new: true }
              );
            })
          );

          return {
            bundleProduct: productId,
            updatedComponents
          };
        }

        // --- Regular product (non-bundle) ---
        if (product.quantity >= quantity) {
          return await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { quantity: -quantity } },
            { new: true }
          );
        } else {
          return {
            error: `Insufficient quantity for product with ID ${productId}`
          };
        }
      })
    );

    const filteredUpdatedProducts = updatedProducts.filter((p) => p !== null);

    return NextResponse.json(
      { response: filteredUpdatedProducts },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating products:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}




// This basically like get Product by Id for Edit Page 
// This only get details
export async function POST(request: Request) {
  try {
    const productID = await request.json();
    const getProduct = await Product.findById({ _id: productID });
    return Response.json(getProduct, { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

import type { NextApiRequest, NextApiResponse } from "next";
import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

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

    console.log("Received products to update:", productsToUpdate);

    const updatedProducts = await Promise.all(
      productsToUpdate.map(async (productData) => {
        const { productId, quantity } = productData;

        if (!productId || typeof quantity !== "number") {
          return { error: `Invalid product data for productId: ${productId}` };
        }

        const product = await Product.findOne({ _id: productId });
        if (!product) {
          // Skip and move to the next product without making any changes
          return null;
        }

        if (product.quantity > 0 && product.quantity - quantity >= 0) {
          return await Product.findOneAndUpdate(
            { _id: productId },
            { $inc: { quantity: -quantity } },
            { new: true }
          );
        } else {
          return { error: `Insufficient quantity for product with ID ${productId}` };
        }
      })
    );

    const filteredUpdatedProducts = updatedProducts.filter((prod) => prod !== null);

    // Always return a response, even if no products were updated
    return NextResponse.json({ response: filteredUpdatedProducts }, { status: 200 });
  } catch (error) {
    console.error("Error updating products:", error);
    // Ensure a response is returned on error
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}


// This basically like get Product by Id for Edit Page 
// This only get details
export async function POST(request: Request) {
  try {
    const productID = await request.json();
    const getProduct =await Product.findById({_id:productID});
    return Response.json(getProduct , { status: 200 });
  } catch (error) {
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}

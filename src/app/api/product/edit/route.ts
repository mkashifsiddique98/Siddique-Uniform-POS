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
    console.log("res ;", productsToUpdate);
    const updatedProducts = [];

    // Iterate through the array and update each product's quantity
    for (const productData of productsToUpdate) {
      const productId = productData.productId;
      const quantityToUpdate = productData.quantity;

      // Find the product by productId
      const product = await Product.findOne({ _id: productId });

      if (!product) {
        return Response.json(
          { error: `Product with ID ${productId} not found` },
          { status: 400 }
        );
      }

      // Check if the quantity to update is more than the current quantity
      if (product.quantity > 0 && product.quantity - quantityToUpdate >= 0) {
        // Update the quantity only if it's valid
        const updatedProduct = await Product.findOneAndUpdate(
          { _id: productId },
          { $inc: { quantity: -quantityToUpdate } }, // Decrement quantity by the specified amount
          { new: true }
        );
        updatedProducts.push(updatedProduct);
      } else {
        // If the quantity is 0 or less, don't update and log a message or handle accordingly
        console.log(`Product with ID ${productId} has insufficient quantity or is already 0.`);
      }
    }

    return Response.json({ response: updatedProducts }, { status: 200 });
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
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

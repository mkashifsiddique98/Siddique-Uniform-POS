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

      // Find the product by productId and update its quantity
      const product = await Product.findOneAndUpdate(
        { _id: productId },
        { $inc: { quantity: -quantityToUpdate } }, // Decrement quantity by the specified amount
        { new: true }
      );

      if (!product) {
        return Response.json(
          { error: `Product with ID ${productId} not found` },
          { status: 400 }
        );
      }

      updatedProducts.push(product);
    }

    return Response.json({ response: "products" }, { status: 200 });
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

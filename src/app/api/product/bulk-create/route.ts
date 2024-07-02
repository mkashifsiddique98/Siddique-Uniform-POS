import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { ProductFormState } from "@/types/product";

connectDB(); // Connect to MongoDB
// Create New Bulk Product
export async function POST(request: Request) {
    try {
        const products = await request.json();
        console.log("Bulk upload", products);
    
        // Assuming products is an array of products
        const newProducts = products.map((productData:ProductFormState) => new Product(productData));
    
        // Save all products in bulk
        const savedProducts = await Product.insertMany(newProducts);
    
        console.log("Saved in database:", savedProducts);
        
        return Response.json({ response: savedProducts }, { status: 201 });
    } catch (error) {
      console.error(error);
      return NextResponse.json({ error: "Server error" }, { status: 500 });
    }
  }
import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { ProductFormState } from "@/types/product";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

connectDB(); // Connect to MongoDB
// Create New Bulk Product
export async function POST(request: Request) {
<<<<<<< HEAD
  const auth = await requireAuth(request, { page: "product" });
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    try {
        const products = await request.json();
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
import connectDB from "@/utils/connectDB";
import Purchase from "@/models/purchase";
import WholeSaler from "@/models/wholesaler";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { ProductFormState } from "@/types/product";

connectDB();

// Create New WholeSaler
export async function POST(request: Request) {
  try {
    const res = await request.json();
    const newPurchase = new Purchase(res);
    const { wholesaler, products, isPaid } = newPurchase;

    // Update wholesaler information
    await WholeSaler.findByIdAndUpdate(wholesaler._id, wholesaler);

    // Function to update product quantities
    const updateProductQuantities = async (products:ProductFormState[]) => {
      for (const product of products) {
        const existingProduct = await Product.findById(product._id);
        if (existingProduct) {
          existingProduct.quantity += product.quantity;
          await existingProduct.save();
        }
      }
    };

    // Update product quantities
    await updateProductQuantities(products);

    const savedPurchase = await newPurchase.save();
    return NextResponse.json({ response: savedPurchase }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const listPurchase = await Purchase.find();
    return NextResponse.json({ listPurchase }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json(); // Assuming the ID is sent in the request body

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deletedPurchase = await Purchase.findByIdAndDelete(id);

    if (!deletedPurchase) {
      return NextResponse.json({ error: "Purchase not found" }, { status: 404 });
    }

    return NextResponse.json({ response: "Purchase deleted successfully" }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

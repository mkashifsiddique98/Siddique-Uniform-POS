import connectDB from "@/utils/connectDB";
import Purchase from "@/models/purchase";
import WholeSaler from "@/models/wholesaler";
import Product from "@/models/Product";
import { NextResponse } from "next/server";
import { ProductFormState } from "@/types/product";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

connectDB();

// Create New WholeSaler
export async function POST(request: Request) {
<<<<<<< HEAD
  const auth = await requireAuth(request, { page: "purchase" });
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  try {
    const res = await request.json();
    const newPurchase = new Purchase(res);
    const { wholesaler, products, isPaid } = newPurchase;

    // Check if wholesaler exists
    const existingWholesaler = await WholeSaler.findById(wholesaler._id);
    if (!existingWholesaler) {
      return NextResponse.json({ error: "Wholesaler not found" }, { status: 404 });
    }

    // Update wholesaler information
  const updateWholesaler =  await WholeSaler.findByIdAndUpdate(
      wholesaler._id,
      {
        paymentStatus: wholesaler.paymentStatus,
        pendingBalance: wholesaler.pendingBalance,
      }
    );

    // Function to update product quantities
    const updateProductQuantities = async (products: ProductFormState[]) => {
      for (const product of products) {
        const existingProduct = await Product.findById(product._id);
        if (existingProduct) {
<<<<<<< HEAD
          existingProduct.quantity = Number(existingProduct.quantity || 0) + Number(product.quantity || 0);
=======
          existingProduct.quantity += product.quantity;
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
          await existingProduct.save();
        } else {
          return NextResponse.json({ error: `Product with ID ${product._id} not found` }, { status: 404 });
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
<<<<<<< HEAD
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  try {
    const listPurchase = await Purchase.find();
    return NextResponse.json({response: listPurchase }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
<<<<<<< HEAD
  const auth = await requireAuth(request, { page: "purchase" });
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  try {
    const { id } = await request.json(); // Assuming the ID is sent in the request body
    
    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const deletedPurchase = await Purchase.findByIdAndDelete(id);

    if (!deletedPurchase) {
      return NextResponse.json(
        { error: "Purchase not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { response: "Purchase deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

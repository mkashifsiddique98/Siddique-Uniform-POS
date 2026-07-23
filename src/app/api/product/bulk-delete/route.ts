import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

connectDB(); // Connect to MongoDB

// Utility function to extract filename from image path
function extractFileNameFromUrl(url: string): string {
  return url.split("/").pop() || "";
}

async function deleteImageFromServer(filename: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/upload/delete-image`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });

    if (!res.ok) {
      console.error(`Failed to delete image: ${filename}`);
    }
  } catch (err) {
    console.error("Error calling delete-image API:", err);
  }
}

export async function DELETE(request: Request) {
  try {
    const productsToDelete = await request.json();

    const productIdsToDelete = productsToDelete.map(
      (product: { _id: string }) => product._id
    );

    // Fetch all matching products to get image filenames before deletion
    const products = await Product.find({ _id: { $in: productIdsToDelete } });

    // Delete associated images if any
    for (const product of products) {
      if (Array.isArray(product.images)) {
        for (const imageUrl of product.images) {
          const filename = extractFileNameFromUrl(imageUrl);
          if (filename) {
            await deleteImageFromServer(filename);
          }
        }
      }
    }

    // Now delete products from DB
    const deleteResult = await Product.deleteMany({
      _id: { $in: productIdsToDelete },
    });

    return NextResponse.json({ response: deleteResult }, { status: 200 });
  } catch (error) {
    console.error("Bulk delete error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

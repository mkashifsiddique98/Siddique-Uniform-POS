import connectDB from "@/utils/connectDB";
import Product from "@/models/Product";
import { NextResponse } from "next/server";

connectDB(); // Connect to MongoDB

// Delete Products in Bulk
export async function DELETE(request: Request) {
  try {
    const productsToDelete = await request.json();

    // Assuming each product in productsToDelete has an 'id' field
    const productIdsToDelete = productsToDelete.map(
      (product: { _id: any }) => product._id
    );

    // Perform bulk delete operation
    const deleteResult = await Product.deleteMany({
      _id: { $in: productIdsToDelete },
    });

    return Response.json({ response: deleteResult }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

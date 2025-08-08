import connectDB from "@/utils/connectDB";
import Customer from "@/models/customer";
import { NextResponse } from "next/server";
connectDB();

// Create New Customer
export async function POST(request: Request) {
  try {
    const res = await request.json();
    const newCustomer = new Customer(res);
    const savedCustomer = await newCustomer.save();
    return Response.json({ response: savedCustomer }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function GET(request: Request) {
  try {
    const listCustomer = await Customer.find();
    return Response.json({ listCustomer }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 });
    }

   // Delete the customer by ID
    const result = await Customer.deleteOne({_id:id});

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Customer deleted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ message: "Error deleting customer", error: error.message }, { status: 500 });
  }
}
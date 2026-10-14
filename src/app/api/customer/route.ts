import connectDB from "@/utils/connectDB";
import Customer from "@/models/customer";
import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { customerPayloadSchema } from "@/validation/pos";

connectDB();

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const payload = await request.json();
    const parsed = customerPayloadSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid customer payload" }, { status: 400 });
    }

    const newCustomer = new Customer(parsed.data);
    const savedCustomer = await newCustomer.save();
    return Response.json({ response: savedCustomer }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;

    const listCustomer = await Customer.find();
    return Response.json({ listCustomer }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
export async function DELETE(request: Request) {
  try {
    const auth = await requireAuth(request, { page: "customer" });
    if (!auth.ok) return auth.response;

    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: "Customer ID is required" }, { status: 400 });
    }

    const result = await Customer.deleteOne({_id:id});

    if (result.deletedCount === 0) {
      return NextResponse.json({ message: "Customer not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Customer deleted successfully!" }, { status: 200 });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ message: "Error deleting customer", error: (error as Error).message }, { status: 500 });
  }
}
import connectDB from "@/utils/connectDB";
import Customer from "@/models/customer";
import { NextResponse } from "next/server";
connectDB();

// Create New Customer
export async function POST(request: Request) {
  try {
    const res = await request.json();
    const newCustomer = new Customer(res);
    console.log(res);
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

// app/api/expense-categories/route.ts
import { NextRequest, NextResponse } from "next/server";

import ExpenseCategory from "@/models/ExpenseCategory";
import connectDB from "@/utils/connectDB";
 connectDB();
export async function POST(req: NextRequest) {
  try {
    
    const { name } = await req.json();
     console.log(name,"categiry")
    if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });
  
    const exists = await ExpenseCategory.findOne({ name });
    if (exists) {
      return NextResponse.json({ error: "Category already exists" }, { status: 409 });
    }


    const newCategory = await ExpenseCategory.create({ name });
    return NextResponse.json(newCategory, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const categories = await ExpenseCategory.find().sort({ name: 1 }); // optional sorting
    return NextResponse.json(categories, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
// app/api/expense-categories/route.ts
import { NextRequest, NextResponse } from "next/server";

import ExpenseCategory from "@/models/ExpenseCategory";
import connectDB from "@/utils/connectDB";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
 connectDB();
export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req, { page: "utilize" });
    if (!auth.ok) return auth.response;
=======
 connectDB();
export async function POST(req: NextRequest) {
  try {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    
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
<<<<<<< HEAD
    const auth = await requireAuth(req);
    if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    await connectDB();
    const categories = await ExpenseCategory.find().sort({ name: 1 }); // optional sorting
    return NextResponse.json(categories, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}
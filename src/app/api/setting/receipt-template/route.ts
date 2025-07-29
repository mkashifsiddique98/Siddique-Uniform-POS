import connectDB from "@/utils/connectDB";
import ReceiptTemplate from "@/models/receipt-template";
import { NextResponse } from "next/server";
import mongoose from "mongoose";

connectDB();

export async function GET() {
    try {
        const receiptTemplates = await ReceiptTemplate.find({});
        return NextResponse.json({ success: true, data: receiptTemplates }, { status: 200 });
    } catch (error) {
        console.error("Error fetching receipt templates", error);
        return NextResponse.json({ success: false, error: (error as any)?.message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const receiptTemplate = await ReceiptTemplate.create(body);
        return NextResponse.json({ success: true, data: receiptTemplate }, { status: 201 });
    } catch (error) {
        console.error("Error creating receipt template", error);
        return NextResponse.json({ success: false, error: (error as any)?.message }, { status: 400 });
    }
}

export async function PUT(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");
        const body = await request.json();

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
        }

        const receiptTemplate = await ReceiptTemplate.findByIdAndUpdate(id, body, {
            new: true,
            runValidators: true,
        });

        if (!receiptTemplate) {
            return NextResponse.json({ success: false, error: "ReceiptTemplate not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: receiptTemplate }, { status: 200 });
    } catch (error) {
        console.error("Error updating receipt template", error);
        return NextResponse.json({ success: false, error: (error as any)?.message }, { status: 400 });
    }
}

export async function DELETE(request: Request) {
    try {
        const url = new URL(request.url);
        const id = url.searchParams.get("id");

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
        }

        const deletedReceiptTemplate = await ReceiptTemplate.findByIdAndDelete(id);

        if (!deletedReceiptTemplate) {
            return NextResponse.json({ success: false, error: "ReceiptTemplate not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: deletedReceiptTemplate }, { status: 200 });
    } catch (error) {
        console.error("Error deleting receipt template", error);
        return NextResponse.json({ success: false, error: (error as any)?.message }, { status: 400 });
    }
}
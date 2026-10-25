import connectDB from "@/utils/connectDB";
import ReceiptTemplate from "@/models/receipt-template";
import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { requireAuth } from "@/lib/auth";
import { TtlCache } from "@/lib/ttlCache";

connectDB();

// Rarely changes; every write in this file clears it
const templateCache = new TtlCache<any[]>(5 * 60 * 1000, 1);

export async function GET(request: Request) {
    try {
    const auth = await requireAuth(request);
    if (!auth.ok) return auth.response;
        let receiptTemplates = templateCache.get("all");
        if (!receiptTemplates) {
            receiptTemplates = await ReceiptTemplate.find({});
            templateCache.set("all", receiptTemplates);
        }
        return NextResponse.json({ success: true, data: receiptTemplates }, { status: 200 });
    } catch (error) {
        console.error("Error fetching receipt templates", error);
        return NextResponse.json({ success: false, error: (error as any)?.message }, { status: 400 });
    }
}

export async function POST(request: Request) {
    try {
    const auth = await requireAuth(request, { role: "admin" });
    if (!auth.ok) return auth.response;
        const body = await request.json();
        const receiptTemplate = await ReceiptTemplate.create(body);
        templateCache.clear();
        return NextResponse.json({ success: true, data: receiptTemplate }, { status: 201 });
    } catch (error) {
        console.error("Error creating receipt template", error);
        return NextResponse.json({ success: false, error: (error as any)?.message }, { status: 400 });
    }
}

export async function PUT(request: Request) {
    try {
    const auth = await requireAuth(request, { role: "admin" });
    if (!auth.ok) return auth.response;
        const body = await request.json();
          
        if (!body._id || !mongoose.Types.ObjectId.isValid(body._id)) {
            return NextResponse.json({ success: false, error: "Invalid ID" }, { status: 400 });
        }

        const receiptTemplate = await ReceiptTemplate.findByIdAndUpdate(body._id, body, {
            new: true,
            runValidators: true,
        });
        templateCache.clear();

        if (!receiptTemplate) {
            return NextResponse.json({ success: false, error: "ReceiptTemplate not found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, data: receiptTemplate }, { status: 200 });
    } catch (error) {
        console.error("Error updating receipt template", error);
        return NextResponse.json({ success: false, error: (error as any)?.message }, { status: 400 });
    }
}


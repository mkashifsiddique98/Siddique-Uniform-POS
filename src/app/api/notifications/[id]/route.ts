
import { NextResponse } from "next/server";

import Notification from "@/models/notification";
import connectDB from "@/utils/connectDB";
import { requireAuth } from "@/lib/auth";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  await connectDB();
  const deleted = await Notification.findByIdAndDelete(params.id);
 
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}


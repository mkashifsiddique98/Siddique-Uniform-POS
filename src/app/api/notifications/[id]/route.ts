
import { NextResponse } from "next/server";

import Notification from "@/models/notification";
import connectDB from "@/utils/connectDB";

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const deleted = await Notification.findByIdAndDelete(params.id);
 
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}



import { NextResponse } from "next/server";

import Notification from "@/models/notification";
import connectDB from "@/utils/connectDB";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
<<<<<<< HEAD
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  await connectDB();
  const deleted = await Notification.findByIdAndDelete(params.id);
 
  if (!deleted) {
    return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}


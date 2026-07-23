// /app/api/notifications/read/[id]/route.ts

import { NextResponse } from "next/server";
import Notification from "@/models/notification";
import connectDB from "@/utils/connectDB";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const updated = await Notification.findByIdAndUpdate(params.id, {
    read: true,
  });
  return NextResponse.json(updated);
}

// /app/api/notifications/read/[id]/route.ts

import { NextResponse } from "next/server";
import Notification from "@/models/notification";
import connectDB from "@/utils/connectDB";
import { requireAuth } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
  await connectDB();
  const updated = await Notification.findByIdAndUpdate(params.id, {
    read: true,
  });
  return NextResponse.json(updated);
}

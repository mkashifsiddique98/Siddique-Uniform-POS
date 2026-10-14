// /app/api/notifications/read/[id]/route.ts

import { NextResponse } from "next/server";
import Notification from "@/models/notification";
import connectDB from "@/utils/connectDB";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
<<<<<<< HEAD
  const auth = await requireAuth(req);
  if (!auth.ok) return auth.response;
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  await connectDB();
  const updated = await Notification.findByIdAndUpdate(params.id, {
    read: true,
  });
  return NextResponse.json(updated);
}

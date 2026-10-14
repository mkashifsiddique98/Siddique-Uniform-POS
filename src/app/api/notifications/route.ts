import { NextResponse } from "next/server";
import { checkNotifications } from "@/utils/checkNotification";
import connectDB from "@/utils/connectDB";
import Notification from "@/models/notification";
<<<<<<< HEAD
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
=======

export async function GET() {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  await checkNotifications();
  await connectDB();
   const notifications = await Notification.find().sort({ createdAt: -1 });
   
  
  return NextResponse.json({ message: "Notifications checked",notifications:notifications });
}
<<<<<<< HEAD
export async function DELETE(request: Request) {
  const auth = await requireAuth(request);
  if (!auth.ok) return auth.response;
=======
export async function DELETE() {
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
  await checkNotifications();
  await connectDB();

  // Delete all notifications
  await Notification.deleteMany({});

  return NextResponse.json({
    message: "All notifications deleted successfully",
  });
}

import { NextResponse } from "next/server";
import { checkNotifications } from "@/utils/checkNotification";
import connectDB from "@/utils/connectDB";
import Notification from "@/models/notification";

export async function GET() {
  await checkNotifications();
  await connectDB();
   const notifications = await Notification.find().sort({ createdAt: -1 });
   
  
  return NextResponse.json({ message: "Notifications checked",notifications:notifications });
}
export async function DELETE() {
  await checkNotifications();
  await connectDB();

  // Delete all notifications
  await Notification.deleteMany({});

  return NextResponse.json({
    message: "All notifications deleted successfully",
  });
}

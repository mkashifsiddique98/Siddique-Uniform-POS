"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Notification = {
  _id: string;
  type: "low-stock" | "due-date";
  message: string;
  read: boolean;
  createdAt: string;
  productId?: string;
  invoiceId?: string;
};

export function AlertNav() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await fetch("/api/notifications");
      const { notifications } = await res.json();
      setNotifications(notifications);
      const unread = notifications.filter((n) => !n.read).length;
      setUnreadCount(unread);
    };

    fetchNotifications();
  }, []);

  const grouped = {
    "low-stock": notifications.filter((n) => n.type === "low-stock"),
    "due-date": notifications.filter((n) => n.type === "due-date"),
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative cursor-pointer">
          <Bell className="w-6 h-6" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 text-[10px] bg-red-500 font-bold flex items-center justify-center rounded-full text-white">
              {unreadCount}
            </Badge>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-80 p-2 max-h-96 overflow-auto"
        align="end"
        forceMount
      >
        <Tabs defaultValue="low-stock" className="w-full">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="low-stock">Low Stock ({grouped["low-stock"].length})</TabsTrigger>
            <TabsTrigger value="due-date">Due Date ({grouped["due-date"].length})</TabsTrigger>
          </TabsList>

          <TabsContent value="low-stock" className="space-y-2">
            {grouped["low-stock"].length > 0 ? (
              grouped["low-stock"].splice(0, 3).map((n) => (
                <Link href={"/product/low-stock"}>
                  <DropdownMenuLabel
                    key={n._id}
                    className={`border rounded p-2 hover:bg-slate-100 cursor-pointer ${
                      !n.read ? "bg-muted" : ""
                    }`}
                  >
                    <div className="font-semibold text-sm">Low Stock Alert</div>
                    <div className="text-xs text-muted-foreground">
                      {n.message}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </DropdownMenuLabel>
                </Link>
              ))
            ) : (
              <DropdownMenuLabel className="text-center text-sm py-2 text-muted-foreground">
                No low stock notifications
              </DropdownMenuLabel>
            )}
          </TabsContent>

          <TabsContent value="due-date" className="space-y-2">
            {grouped["due-date"].length > 0 ? (
              grouped["due-date"].splice(0, 3).map((n) => (
                <Link href={"/invoice/special-order"}>
                  <DropdownMenuLabel
                    key={n._id}
                    className={`border rounded p-2 hover:bg-slate-100 cursor-pointer ${
                      !n.read ? "bg-muted" : ""
                    }`}
                  >
                    <div className="font-semibold text-sm">Due Date Alert</div>
                    <div className="text-xs text-muted-foreground">
                      {n.message}
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {new Date(n.createdAt).toLocaleString()}
                    </div>
                  </DropdownMenuLabel>
                </Link>
              ))
            ) : (
              <DropdownMenuLabel className="text-center text-sm py-2 text-muted-foreground">
                No due date notifications
              </DropdownMenuLabel>
            )}
          </TabsContent>
        </Tabs>

        <div className="text-center mt-2 border-t pt-2">
          <Link
            href="/notification"
            className="text-xs font-bold text-blue-600 hover:underline"
          >
            View All Notifications
          </Link>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

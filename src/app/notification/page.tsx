"use client";

import { useEffect, useState } from "react";
import { Notification } from "@/types/notification";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import BreadCrum from "@/components/custom-components/bread-crum";
import { useRouter } from "next/navigation";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const { notifications } = await res.json();
      setNotifications(notifications);
    } catch (error) {
      console.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const grouped = {
    "low-stock": notifications.filter((n) => n.type === "low-stock"),
    "due-date": notifications.filter((n) => n.type === "due-date"),
  };

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Notifiation" subfolder="View Notification" />
      {loading?(<div className="space-y-4 p-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="w-full h-12" />
        ))}
      </div>):(<div className="p-4">
        <Tabs defaultValue="low-stock" className="w-full">
          <TabsList className="grid grid-cols-2 mb-2">
            <TabsTrigger value="low-stock">Low Stock</TabsTrigger>
            <TabsTrigger value="due-date">Due Date</TabsTrigger>
          </TabsList>

          <TabsContent value="low-stock">
            <NotificationList
              title="Low Stock Alert"
              items={grouped["low-stock"]}
              emptyMessage="No low stock notifications"
              redirectPath="/product/low-stock"
            />
          </TabsContent>

          <TabsContent value="due-date">
            <NotificationList
              title="Due Date Alert"
              items={grouped["due-date"]}
              emptyMessage="No due date notifications"
              redirectPath="/invoice/special-order"
            />
          </TabsContent>
        </Tabs>
      </div>)}
      
    </div>
  );
}

type NotificationListProps = {
  title: string;
  items: Notification[];
  emptyMessage: string;
  redirectPath :string;
};

function NotificationList({
  title,
  items,
  emptyMessage,
  redirectPath
}: NotificationListProps) {
  if (items.length === 0) {
    return (
      <DropdownMenuLabel className="text-center text-sm py-2 text-muted-foreground">
        {emptyMessage}
      </DropdownMenuLabel>
    );
  }
 const router= useRouter()
  return (
    <div className="space-y-2">
      {items.map((n,index) => (
        <DropdownMenuLabel
          key={`${n._id}`+index}
          onClick={() => router.push(`${redirectPath}`)}
          className={`border rounded p-2 hover:bg-slate-100 cursor-pointer ${
            !n.read ? "bg-muted" : ""
          }`}
        >
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs text-muted-foreground truncate">
            {n.message}
          </div>
          <div className="text-[10px] text-gray-500 mt-1">
            {new Date(n.createdAt).toLocaleString()}
          </div>
        </DropdownMenuLabel>
      ))}
    </div>
  );
}

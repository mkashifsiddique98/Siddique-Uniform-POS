"use client";

import { useEffect, useState } from "react";
import { Notification } from "@/types/notification";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import BreadCrum from "@/components/custom-components/bread-crum";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2, CheckCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function NotificationPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const router = useRouter();

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

  const clearAllNotifications = async () => {
    try {
      await fetch("/api/notifications/", { method: "DELETE" });
      setNotifications([]);
      toast({ title: "All notifications cleared" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear notifications",
        variant: "destructive",
      });
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
      <div className="flex justify-between items-center mb-4">
        <BreadCrum mainfolder="Notification" subfolder="View Notification" />
        <Button
          variant="destructive"
          onClick={clearAllNotifications}
          className="flex items-center gap-1 w-min-72"
        >
          <Trash2 className="w-4 h-4" /> Clear All
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4 p-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-12" />
          ))}
        </div>
      ) : (
        <div className="p-4">
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
                reloadNotifications={loadNotifications}
              />
            </TabsContent>

            <TabsContent value="due-date">
              <NotificationList
                title="Due Date Alert"
                items={grouped["due-date"]}
                emptyMessage="No due date notifications"
                redirectPath="/invoice/special-order"
                reloadNotifications={loadNotifications}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
}

type NotificationListProps = {
  title: string;
  items: Notification[];
  emptyMessage: string;
  redirectPath: string;
  reloadNotifications: () => void;
};

function NotificationList({
  title,
  items,
  emptyMessage,
  redirectPath,
  reloadNotifications,
}: NotificationListProps) {
  const router = useRouter();
  const [localItems, setLocalItems] = useState(items);
  const { toast } = useToast();

  useEffect(() => {
    setLocalItems(items);
  }, [items]);

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setLocalItems((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      toast({
        title: "Marked as read",
        description: "Notification has been marked as read.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to mark notification as read.",
        variant: "destructive",
      });
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
      setLocalItems((prev) => prev.filter((n) => n._id !== id));
      toast({
        title: "Deleted",
        description: "Notification has been deleted.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to delete notification.",
        variant: "destructive",
      });
    }
  };

  if (localItems.length === 0) {
    return (
      <DropdownMenuLabel className="text-center text-sm py-2 text-muted-foreground">
        {emptyMessage}
      </DropdownMenuLabel>
    );
  }

  return (
    <div className="space-y-2">
      {localItems.map((n, index) => (
        <div
          key={`${n._id}` + index}
          className={`border rounded p-2 hover:bg-slate-100 ${
            !n.read ? "bg-muted" : ""
          }`}
        >
          <div
            onClick={() => router.push(redirectPath)}
            className="cursor-pointer"
          >
            <div className="font-semibold text-sm">{title}</div>
            <div className="text-xs text-muted-foreground truncate">
              {n.message}
            </div>
            <div className="text-[10px] text-gray-500 mt-1">
              {new Date(n.createdAt).toLocaleString()}
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            {!n.read && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => markAsRead(n._id)}
                className="w-full"
              >
                <CheckCircle className="w-4 h-4 mr-1" /> Read
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={() => deleteNotification(n._id)}
              className="w-full"
            >
              <Trash2 className="w-4 h-4 mr-1" /> Delete
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

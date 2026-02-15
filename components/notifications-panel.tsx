"use client";

import { useEffect, useState } from "react";
import { Bell, Check, CheckCheck, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();

      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  // Fetch when popover opens
  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      try {
        await fetch("/api/notifications/mark-read", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: notification.id }),
        });

        // Update local state
        setNotifications(
          notifications.map((n) =>
            n.id === notification.id ? { ...n, read: true } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate
    if (notification.link) {
      setOpen(false);
      router.push(notification.link);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingAllRead(true);

    try {
      const res = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
      });

      const data = await res.json();

      if (data.success) {
        setNotifications(notifications.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error marking all as read:", error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleDeleteNotification = async (
    e: React.MouseEvent,
    notificationId: string
  ) => {
    e.stopPropagation();

    try {
      const res = await fetch("/api/notifications/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId }),
      });

      if (res.ok) {
        const deletedNotif = notifications.find((n) => n.id === notificationId);
        setNotifications(notifications.filter((n) => n.id !== notificationId));

        if (deletedNotif && !deletedNotif.read) {
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "change_proposed":
        return "💡";
      case "change_reviewed":
        return "✅";
      case "mention":
        return "💬";
      case "invite":
        return "👥";
      default:
        return "🔔";
    }
  };

  // Group notifications by date
  const groupedNotifications = notifications.reduce((groups, notif) => {
    const date = new Date(notif.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    let key = "Older";
    if (date.toDateString() === today.toDateString()) {
      key = "Today";
    } else if (date.toDateString() === yesterday.toDateString()) {
      key = "Yesterday";
    }

    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(notif);
    return groups;
  }, {} as Record<string, Notification[]>);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-600 hover:bg-red-600">
              {unreadCount > 99 ? "99+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div>
            <h3 className="font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <p className="text-xs text-gray-600">{unreadCount} unread</p>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleMarkAllRead}
                  disabled={markingAllRead}
                  title="Mark all as read"
                >
                  <CheckCheck className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Notifications List */}
        <ScrollArea className="h-[500px]">
          {notifications.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-sm font-medium">No notifications</p>
              <p className="text-xs mt-1">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {Object.entries(groupedNotifications).map(([dateLabel, notifs]) => (
                <div key={dateLabel}>
                  {/* Date Header */}
                  <div className="px-4 py-2 bg-gray-50 sticky top-0">
                    <p className="text-xs font-semibold text-gray-700">
                      {dateLabel}
                    </p>
                  </div>

                  {/* Notifications for this date */}
                  {notifs.map((notif) => (
                    <div
                      key={notif.id}
                      className={`group relative p-4 cursor-pointer hover:bg-gray-50 transition ${
                        !notif.read ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
                      }`}
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <div className="flex items-start gap-3">
                        {/* Icon */}
                        <div className="flex-shrink-0 text-2xl">
                          {getNotificationIcon(notif.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <p className="font-medium text-sm">
                                {notif.title}
                              </p>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                {notif.message}
                              </p>
                              <p className="text-xs text-gray-400 mt-2">
                                {new Date(notif.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>

                            {/* Unread indicator */}
                            {!notif.read && (
                              <div className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />
                            )}
                          </div>
                        </div>

                        {/* Delete button (visible on hover) */}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => handleDeleteNotification(e, notif.id)}
                        >
                          <X className="h-4 w-4 text-gray-400" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="p-3 border-t bg-gray-50">
            <p className="text-xs text-center text-gray-600">
              {notifications.length} notification{notifications.length !== 1 ? "s" : ""}
            </p>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
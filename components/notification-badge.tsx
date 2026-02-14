"use client";

import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export function NotificationBadge() {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch("/api/notifications");
        const data = await res.json();
        if (data.success) {
          setUnreadCount(data.unreadCount);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 30000); // Every 30s
    return () => clearInterval(interval);
  }, []);

  return (
    <Link href="/notifications" className="relative">
      <Bell className="h-6 w-6" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 px-2 py-1 text-xs">
          {unreadCount}
        </Badge>
      )}
    </Link>
  );
}
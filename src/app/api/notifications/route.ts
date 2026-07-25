import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import {
  getNotificationDTO,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notification.service";

export async function GET(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const dto = await getNotificationDTO(session.userId, page, limit);
    return NextResponse.json(dto);
  } catch (error) {
    console.error("Error fetching notification DTO:", error);
    return NextResponse.json(
      { error: "Internal server error fetching notifications." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await markAllNotificationsAsRead(session.userId);
      return NextResponse.json({ message: "All notifications marked as read." });
    }

    if (notificationId) {
      await markNotificationAsRead(session.userId, notificationId);
      return NextResponse.json({ message: "Notification marked as read." });
    }

    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json(
      { error: "Internal server error updating notification state." },
      { status: 500 }
    );
  }
}

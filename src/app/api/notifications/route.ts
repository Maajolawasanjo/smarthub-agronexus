import { NextResponse } from "next/server";
import { getSharedSession, AuthRealm } from "@/lib/session";
import {
  getNotificationDTO,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/services/notification.service";

export async function GET(req: Request) {
  try {
    const auth = await getSharedSession(req, [
      AuthRealm.ADMIN,
      AuthRealm.FARMER,
      AuthRealm.BUYER,
    ]);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);

    const dto = await getNotificationDTO(auth.userId, page, limit);
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
    const auth = await getSharedSession(req, [
      AuthRealm.ADMIN,
      AuthRealm.FARMER,
      AuthRealm.BUYER,
    ]);
    if (!auth) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAll } = body;

    if (markAll) {
      await markAllNotificationsAsRead(auth.userId);
      return NextResponse.json({ message: "All notifications marked as read." });
    }

    if (!notificationId) {
      return NextResponse.json({ error: "notificationId is required." }, { status: 400 });
    }

    const updated = await markNotificationAsRead(notificationId, auth.userId);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return NextResponse.json(
      { error: "Internal server error updating notification." },
      { status: 500 }
    );
  }
}

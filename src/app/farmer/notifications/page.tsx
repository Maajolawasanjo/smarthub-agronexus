"use client";

import { FarmerNotificationList } from "@/components/farmer/notifications/NotificationList";

/**
 * FarmerNotificationsPage Component
 * 
 * Serves as the primary container for the farmer's notification center.
 */
export default function FarmerNotificationsPage() {
    return (
        <div className="max-w-5xl mx-auto pb-12 px-4 md:px-0">
            <FarmerNotificationList />
        </div>
    );
}


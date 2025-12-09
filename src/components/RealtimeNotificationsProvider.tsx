import { useRealtimeNotifications } from "@/hooks/useRealtimeNotifications";

export function RealtimeNotificationsProvider() {
  useRealtimeNotifications();
  return null;
}

import { useActivityTracking } from "@/hooks/useActivityTracking";

export function ActivityTrackingProvider() {
  useActivityTracking();
  return null;
}

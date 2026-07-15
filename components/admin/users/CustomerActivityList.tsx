// components/admin/users/CustomerActivityList.tsx
//
// Timeline of customer events. Renders customer_activity rows with
// event-type-specific icons + descriptions.

"use client";

import { Card } from "@/components/ui/card";
import {
  LogIn, LogOut, UserPlus, Mail, MailCheck, KeyRound,
  ShoppingCart, Calendar, Ticket, MessageSquare, User,
  MapPin, AlertCircle,
} from "lucide-react";

type Activity = {
  id: string;
  event_type: string;
  resource_type: string | null;
  resource_id: string | null;
  metadata: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

const EVENT_CONFIG: Record<string, { icon: any; label: string; color: string }> = {
  signup: { icon: UserPlus, label: "Signed up", color: "text-blue-600" },
  login: { icon: LogIn, label: "Logged in", color: "text-green-600" },
  logout: { icon: LogOut, label: "Logged out", color: "text-muted-foreground" },
  email_verified: { icon: MailCheck, label: "Email verified", color: "text-green-600" },
  password_reset_requested: { icon: KeyRound, label: "Requested password reset", color: "text-orange-600" },
  password_reset_completed: { icon: KeyRound, label: "Reset password", color: "text-green-600" },
  session_invalidated: { icon: AlertCircle, label: "Session invalidated", color: "text-red-600" },
  profile_updated: { icon: User, label: "Updated profile", color: "text-muted-foreground" },
  address_added: { icon: MapPin, label: "Added address", color: "text-muted-foreground" },
  marketing_consent_changed: { icon: Mail, label: "Updated marketing preferences", color: "text-muted-foreground" },
  // Engine-specific
  order_placed: { icon: ShoppingCart, label: "Placed order", color: "text-blue-600" },
  order_completed: { icon: ShoppingCart, label: "Order completed", color: "text-green-600" },
  order_canceled: { icon: ShoppingCart, label: "Order canceled", color: "text-red-600" },
  booking_created: { icon: Calendar, label: "Created booking", color: "text-blue-600" },
  booking_confirmed: { icon: Calendar, label: "Booking confirmed", color: "text-green-600" },
  booking_canceled: { icon: Calendar, label: "Booking canceled", color: "text-red-600" },
  ticket_purchased: { icon: Ticket, label: "Purchased tickets", color: "text-blue-600" },
  inquiry_submitted: { icon: MessageSquare, label: "Submitted inquiry", color: "text-blue-600" },
};

export function CustomerActivityList({ activity }: { activity: Activity[] }) {
  if (activity.length === 0) {
    return (
      <Card className="p-12 text-center text-muted-foreground">
        No activity yet.
      </Card>
    );
  }
  
  return (
    <Card className="divide-y">
      {activity.map((event) => {
        const config = EVENT_CONFIG[event.event_type] || {
          icon: AlertCircle,
          label: event.event_type.replace(/_/g, " "),
          color: "text-muted-foreground",
        };
        const Icon = config.icon;
        
        return (
          <div key={event.id} className="p-4 flex items-start gap-3">
            <div className={`mt-0.5 ${config.color}`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{config.label}</p>
                <p className="text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateTime(event.created_at)}
                </p>
              </div>
              {(event.ip_address || event.metadata?.user_agent_short) && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.ip_address && <span>{event.ip_address}</span>}
                  {event.metadata?.user_agent_short && (
                    <> · {event.metadata.user_agent_short}</>
                  )}
                </p>
              )}
              {event.resource_type && event.resource_id && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {event.resource_type} #{event.resource_id.slice(0, 8)}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </Card>
  );
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

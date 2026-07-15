// components/admin/subscribers/SubscribersTable.tsx
//
// Subscribers list with search, filter, CSV export, mark-unsubscribed action.

"use client";

import { useState, useMemo } from "react";
import { Search, Download, MoreVertical, Mail, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

type Subscriber = {
  id: string;
  email: string;
  name: string | null;
  source: string;
  tags: string[];
  consent_given_at: string;
  unsubscribed_at: string | null;
  unsubscribe_reason: string | null;
  created_at: string;
};

const SOURCE_LABEL: Record<string, string> = {
  footer_signup: "Footer",
  popup: "Popup",
  checkout_optin: "Checkout",
  imported: "Imported",
  admin_added: "Manual",
  inline_block: "Inline",
};

export function SubscribersTable({
  subscribers,
  canManage,
}: {
  subscribers: Subscriber[];
  canManage: boolean;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "unsubscribed">("active");
  
  const filtered = useMemo(() => {
    return subscribers.filter(s => {
      if (filter === "active" && s.unsubscribed_at) return false;
      if (filter === "unsubscribed" && !s.unsubscribed_at) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.email.toLowerCase().includes(q) && !s.name?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [subscribers, search, filter]);
  
  const handleExport = () => {
    const headers = ["Email", "Name", "Source", "Tags", "Subscribed", "Status", "Unsubscribed at"];
    const rows = filtered.map(s => [
      s.email,
      s.name ?? "",
      SOURCE_LABEL[s.source] ?? s.source,
      (s.tags ?? []).join("; "),
      new Date(s.consent_given_at).toISOString(),
      s.unsubscribed_at ? "Unsubscribed" : "Active",
      s.unsubscribed_at ?? "",
    ]);
    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `subscribers-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} subscribers`);
  };
  
  const handleUnsubscribe = async (id: string) => {
    const { error } = await supabase
      .from("subscribers")
      .update({
        unsubscribed_at: new Date().toISOString(),
        unsubscribe_reason: "Marked unsubscribed by admin",
      })
      .eq("id", id);
    
    if (error) {
      toast.error("Couldn't unsubscribe — please try again.");
      return;
    }
    
    toast.success("Subscriber unsubscribed");
    router.refresh();
  };
  
  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by email or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              {filter === "all" ? "All" : filter === "active" ? "Active only" : "Unsubscribed"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilter("all")}>All</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("active")}>Active only</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilter("unsubscribed")}>Unsubscribed</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>
      
      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Subscriber</th>
              <th className="px-4 py-3 font-medium">Source</th>
              <th className="px-4 py-3 font-medium">Tags</th>
              <th className="px-4 py-3 font-medium">Subscribed</th>
              <th className="px-4 py-3 font-medium">Status</th>
              {canManage && <th className="px-4 py-3 font-medium w-12"></th>}
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={canManage ? 6 : 5} className="text-center py-12 text-muted-foreground">
                  No subscribers match your filters.
                </td>
              </tr>
            ) : (
              filtered.map(s => (
                <tr key={s.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3">
                    <div className="font-medium">{s.email}</div>
                    {s.name && <div className="text-xs text-muted-foreground">{s.name}</div>}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {SOURCE_LABEL[s.source] ?? s.source}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {(s.tags ?? []).map(t => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {new Date(s.consent_given_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    {s.unsubscribed_at ? (
                      <Badge variant="outline" className="text-muted-foreground">Unsubscribed</Badge>
                    ) : (
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">Active</Badge>
                    )}
                  </td>
                  {canManage && (
                    <td className="px-4 py-3">
                      {!s.unsubscribed_at && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUnsubscribe(s.id)}>
                              <X className="w-4 h-4 mr-2" />
                              Mark unsubscribed
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

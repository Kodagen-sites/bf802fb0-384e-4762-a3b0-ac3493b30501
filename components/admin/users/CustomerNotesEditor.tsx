// components/admin/users/CustomerNotesEditor.tsx
//
// Internal admin notes editor — visible only to staff, not to the customer.

"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateCustomerNotes } from "@/app/admin/_actions/customer-management";

export function CustomerNotesEditor({
  userId,
  initialNotes,
  canWrite,
}: {
  userId: string;
  initialNotes: string;
  canWrite: boolean;
}) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState(initialNotes);
  
  const isDirty = notes !== savedNotes;
  
  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      formData.set("user_id", userId);
      formData.set("notes", notes);
      
      const result = await updateCustomerNotes(formData);
      if (result.error) {
        toast.error(result.error);
        return;
      }
      
      setSavedNotes(notes);
      toast.success("Notes saved");
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="space-y-3">
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add internal notes about this customer (e.g. 'Called about refund 2024-01-15, satisfied with resolution')"
        rows={4}
        disabled={!canWrite}
      />
      {canWrite && isDirty && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => setNotes(savedNotes)}>
            Cancel
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <><Loader2 className="w-3 h-3 mr-2 animate-spin" />Saving...</> : "Save notes"}
          </Button>
        </div>
      )}
    </div>
  );
}

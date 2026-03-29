"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface Member {
  id: number;
  bioguideId: string;
  name: string | null;
  contact: string | null;
  website: string | null;
  missingContactInfo: boolean | null;
}

interface PaginationInfo {
  total: number;
  pages: number;
  currentPage: number;
  perPage: number;
}

interface Props {
  initialMembers: Member[];
  pagination: PaginationInfo;
}

export function MemberContactList({ initialMembers, pagination }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const router = useRouter();

  const handleUpdateMember = async (
    bioguideId: string,
    field: "contact" | "website",
    value: string
  ) => {
    try {
      setMembers((prev) =>
        prev.map((member) =>
          member.bioguideId === bioguideId
            ? { ...member, [field]: value }
            : member
        )
      );

      const response = await fetch("/api/dev/member-info", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bioguideId, [field]: value }),
      });

      if (!response.ok) throw new Error("Failed to update member info");

      toast.success(
        `Updated ${field} for ${members.find((m) => m.bioguideId === bioguideId)?.name}`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update member info");
      setMembers(initialMembers);
    }
  };

  const handleGoogleSearch = (name: string | null) => {
    const searchQuery = encodeURIComponent(`${name ?? ""} congress website`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
  };

  const handleToggleMissingInfo = async (
    bioguideId: string,
    value: boolean
  ) => {
    try {
      if (value) {
        setMembers((prev) =>
          prev.filter((member) => member.bioguideId !== bioguideId)
        );
      }

      const response = await fetch("/api/dev/member-info-missinginfo", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bioguideId, missingContactInfo: value }),
      });

      if (!response.ok) throw new Error("Failed to update missing info status");

      toast.success(
        `Marked ${members.find((m) => m.bioguideId === bioguideId)?.name} as ${value ? "permanently missing" : "not missing"
        } contact info`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating missing info status:", error);
      toast.error("Failed to update missing info status");
      setMembers(initialMembers);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {pagination.total} members total
      </p>

      <div className="grid gap-3">
        {members.map((member) => (
          <Card key={member.bioguideId}>
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                {/* Top row: search button + name + missing toggle */}
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => handleGoogleSearch(member.name)}
                    title="Search on Google"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                  <span className="font-medium flex-1">
                    {member.name ?? member.bioguideId}
                  </span>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Missing info</span>
                    <Switch
                      checked={member.missingContactInfo ?? false}
                      onCheckedChange={(checked) =>
                        handleToggleMissingInfo(member.bioguideId, checked)
                      }
                    />
                  </div>
                </div>

                {/* Bottom row: website + contact inputs */}
                <div className="flex gap-3">
                  <Input
                    placeholder="Website URL"
                    defaultValue={member.website ?? ""}
                    onBlur={(e) =>
                      handleUpdateMember(
                        member.bioguideId,
                        "website",
                        e.target.value
                      )
                    }
                  />
                  <Input
                    placeholder="Contact URL or info"
                    defaultValue={member.contact ?? ""}
                    onBlur={(e) =>
                      handleUpdateMember(
                        member.bioguideId,
                        "contact",
                        e.target.value
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pagination.pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
            (pageNum) => (
              <Button
                key={pageNum}
                variant={
                  pageNum === pagination.currentPage ? "default" : "outline"
                }
                onClick={() =>
                  router.push(`/dev/add-contacts?page=${pageNum}`)
                }
              >
                {pageNum}
              </Button>
            )
          )}
        </div>
      )}
    </div>
  );
}

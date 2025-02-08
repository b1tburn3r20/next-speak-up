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
  name: string;
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
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bioguideId,
          [field]: value,
        }),
      });

      if (!response.ok) throw new Error("Failed to update member info");

      toast.success(
        `Updated ${field} for ${
          members.find((m) => m.bioguideId === bioguideId)?.name
        }`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating member:", error);
      toast.error("Failed to update member info");
      setMembers(initialMembers);
    }
  };
  const handleGoogleSearch = (name: string) => {
    const searchQuery = encodeURIComponent(`${name} congress website`);
    window.open(`https://www.google.com/search?q=${searchQuery}`, "_blank");
  };

  const handleToggleMissingInfo = async (
    bioguideId: string,
    value: boolean
  ) => {
    try {
      if (value) {
        // Only remove from list if setting to true
        setMembers((prev) =>
          prev.filter((member) => member.bioguideId !== bioguideId)
        );
      }

      const response = await fetch("/api/dev/member-info-missinginfo", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bioguideId,
          missingContactInfo: value,
        }),
      });

      if (!response.ok) throw new Error("Failed to update missing info status");

      toast.success(
        `Marked ${members.find((m) => m.bioguideId === bioguideId)?.name} as ${
          value ? "permanently missing" : "not missing"
        } contact info`
      );
      router.refresh();
    } catch (error) {
      console.error("Error updating missing info status:", error);
      toast.error("Failed to update missing info status");
      setMembers(initialMembers);
    }
  };

  // Rest of the component remains the same...
  return (
    <div className="space-y-4">
      <div className="grid gap-4">
        {members.map((member) => (
          <Card key={member.bioguideId}>
            <CardContent className="p-4">
              <div className="grid grid-cols-[1fr,2fr,2fr,auto,auto] gap-4 items-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleGoogleSearch(member.name)}
                  title="Search on Google"
                >
                  <Search className="h-4 w-4" />
                </Button>
                <div className="font-medium">{member.name}</div>
                <Input
                  placeholder="Website URL"
                  defaultValue={member.website || ""}
                  onBlur={(e) =>
                    handleUpdateMember(
                      member.bioguideId,
                      "website",
                      e.target.value
                    )
                  }
                  className="w-full"
                />
                <Input
                  placeholder="Contact information"
                  defaultValue={member.contact || ""}
                  onBlur={(e) =>
                    handleUpdateMember(
                      member.bioguideId,
                      "contact",
                      e.target.value
                    )
                  }
                  className="w-full"
                />
                <Switch
                  checked={member.missingContactInfo || false}
                  onCheckedChange={(checked) =>
                    handleToggleMissingInfo(member.bioguideId, checked)
                  }
                />
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
                onClick={() => router.push(`/dev/add-contacts?page=${pageNum}`)}
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

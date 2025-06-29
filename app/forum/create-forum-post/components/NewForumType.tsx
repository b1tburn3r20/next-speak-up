"use client";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { useNewForumPostStore } from "../useNewForumPostStore";
import { forumTypes } from "@/app/data/forumTypes";
import { Label } from "@/components/ui/label";
const NewForumType = () => {
  const setType = useNewForumPostStore((f) => f.setType);
  const type = useNewForumPostStore((f) => f.type);
  return (
    <div className="flex flex-col gap-2">
      <Label>Post Type</Label>
      <Select onValueChange={setType} value={type}>
        <SelectTrigger className="w-fit">
          <SelectValue placeholder="Please select a type" />
        </SelectTrigger>
        <SelectContent>
          {forumTypes.map((type, index) => (
            <SelectItem key={index} value={type}>
              {type}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default NewForumType;

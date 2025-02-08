import { HelpCircle } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PolicyAreas } from "@/lib/constants/policy-areas";
import ShineBorder from "@/components/ui/shine-border";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

interface PolicyAreaInfoProps {
  policyArea: string;
}

export function PolicyAreaInfo({ policyArea }: PolicyAreaInfoProps) {
  const policyInfo = PolicyAreas[policyArea];
  if (!policyInfo) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <HelpCircle className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      </PopoverTrigger>
      <PopoverContent className="w-[450px] p-4">
        <div className="space-y-4">
          <h4 className="leading-none mb-3 font-bold">{policyArea}</h4>
          <Separator />
          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai">AI Summary ✨</TabsTrigger>
              <TabsTrigger value="official">Official</TabsTrigger>
            </TabsList>
            <TabsContent value="ai" className="mt-4 text-sm h-[200px]">
              <ShineBorder className="bg-muted/30 rounded-lg h-full">
                <div className="flex flex-col h-full">
                  <div className="flex-1 overflow-auto">
                    {policyInfo.ai_summarized}
                  </div>
                  <div className="pt-1 border-t">
                    <Link
                      href="/about/policy/ai"
                      target="blank_"
                      className="text-blue-700 hover:text-blue-800 hover:underline"
                    >
                      Our policy on our usage of AI...
                    </Link>
                  </div>
                </div>
              </ShineBorder>
            </TabsContent>
            <TabsContent value="official" className="mt-4 text-sm h-[200px]">
              <div className="bg-muted/30 rounded-lg h-full flex flex-col p-3">
                <div className="flex-1 overflow-auto">
                  {policyInfo.official}
                </div>
                <div className="pt-1 border-t">
                  <a
                    href="https://www.congress.gov/help/field-values/policy-area"
                    target="blank_"
                    className="text-blue-700 hover:text-blue-800 hover:underline"
                  >
                    See Official Government Descriptions...
                  </a>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </PopoverContent>
    </Popover>
  );
}

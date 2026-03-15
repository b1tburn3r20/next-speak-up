
import { Select, SelectContent, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BillSummary } from "@prisma/client";
import { useEffect, useState } from "react";
import DOMPurify from 'dompurify';
interface BillOfficialSummariesProps {
  summaries: BillSummary[]
}
const BillOfficialSummaries = ({ summaries }: BillOfficialSummariesProps) => {
  const [activeSummary, setActiveSummary] = useState<BillSummary | null>(null)
  const [versionCode, setVersionCode] = useState<string | null>(null)
  const [cleaned, setCleaned] = useState("")

  useEffect(() => {
    if (summaries?.length) {
      const firstSummary = summaries[0]
      setActiveSummary(firstSummary)
      cleanAndSetSummary(firstSummary)
      setVersionCode(firstSummary.versionCode)
    }
  }, [summaries])

  const cleanAndSetSummary = (foundSummary: BillSummary) => {
    const dirty = foundSummary?.text
    const cleaned = DOMPurify.sanitize(dirty, { USE_PROFILES: { html: true } })
    setCleaned(cleaned)

  }

  const handleSelect = (versionCode: string) => {
    setVersionCode(versionCode)
    const foundSummary = summaries.find((sum) => sum.versionCode === versionCode)
    if (foundSummary) {
      setActiveSummary(foundSummary)
      cleanAndSetSummary(foundSummary)
    }
  }

  if (!summaries) {
    return null
  }



  return (
    <div className="space-y-6">
      <Select value={versionCode} onValueChange={handleSelect}>
        <SelectTrigger>
          <SelectValue placeholder="Select a summary" />
        </SelectTrigger>
        <SelectContent>

          {summaries?.map((sum) => <SelectItem key={sum?.versionCode} value={sum.versionCode} >{sum.actionDesc}</SelectItem>)}
        </SelectContent>
      </Select>
      <div className="bg-background-light p-3 rounded-3xl shadow-md">
        <div dangerouslySetInnerHTML={{ __html: cleaned }} />
      </div>
    </div>
  )
}

export default BillOfficialSummaries

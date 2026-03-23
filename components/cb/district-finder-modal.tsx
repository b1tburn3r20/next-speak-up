"use client"
import { useState } from "react"
import { MapPin, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useModalStore } from "@/app/stores/useModalStore"
import BlockB from "./block-b"
import BlockA from "./block-a"
import StateSelect from "@/components/cb/state-selector"
import DistrictSelect from "@/components/cb/district-selector"

type FoundDistrict = { state: string; district: number }

export function DistrictFinderModal() {
  const isOpen = useModalStore((f) => f.isDistrictModalOpen)
  const setOpen = useModalStore((f) => f.setIsDistrictModalOpen)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [found, setFound] = useState<FoundDistrict | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleFind = async () => {
    setIsLoading(true)
    setError(null)
    setFound(null)
    try {
      const position = await new Promise<GeolocationPosition>((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej)
      )
      const { latitude: lat, longitude: lng } = position.coords

      const response = await fetch("/api/district/find-by-coordinates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      })
      const data = await response.json()
      if (!response.ok || data.error) throw new Error(data.error || "Failed to find district")
      setFound({ state: data.state, district: parseInt(data.district) })
    } catch (err) {
      if (err instanceof GeolocationPositionError) {
        setError("Location access denied. Please select your state and district manually.")
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    if (!found) return
    setIsSaving(true)
    try {
      await fetch("/api/user/set-state-and-district", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(found),
      })
      setOpen(false)
      window.location.reload()
    } catch {
      setError("Failed to save. Please try again.")
    } finally {
      setIsSaving(false)
    }
  }

  const getOrdinal = (n: number) => {
    const j = n % 10, k = n % 100
    if (j === 1 && k !== 11) return "st"
    if (j === 2 && k !== 12) return "nd"
    if (j === 3 && k !== 13) return "rd"
    return "th"
  }

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select your district</DialogTitle>
          <DialogDescription>
            We need your state and congressional district to show your rep's activity.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {!found ? (
            <Button onClick={handleFind} disabled={isLoading} variant="outline" className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />}
              Find my district
            </Button>
          ) : (
            <BlockA className="flex flex-col gap-2 bg-muted/50">
              <BlockB>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">State</p>
                    <p className="font-medium">{found.state}</p>
                  </div>
                  <StateSelect
                    value={found.state}
                    onValueChange={(val) =>
                      setFound((prev) => prev ? { state: val ?? prev.state, district: prev.district } : prev)
                    }
                  />
                </div>
              </BlockB>
              <BlockB>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-muted-foreground text-xs">District</p>
                    <p className="font-medium">
                      {found.district}{getOrdinal(found.district)} Congressional District
                    </p>
                  </div>
                  <DistrictSelect
                    state={found.state}
                    value={String(found.district)}
                    onValueChange={(val) =>
                      setFound((prev) => prev ? { ...prev, district: parseInt(val) } : prev)
                    }
                  />
                </div>
              </BlockB>
            </BlockA>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {found && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={handleFind} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Retry"}
              </Button>
              <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

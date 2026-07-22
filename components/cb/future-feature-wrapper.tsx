"use client"

import { useAppStore } from "@/app/stores/useAppStore"
import { Dialog, DialogTrigger, DialogContent, DialogTitle, DialogHeader, DialogDescription, DialogClose } from "@/components/ui/dialog"
import { Popover, PopoverContent, PopoverTitle, PopoverTrigger, PopoverHeader, PopoverDescription } from "@/components/ui/popover"
import { Info } from "lucide-react"
import { Button } from "../ui/button"

interface FutureFeatureWrapperProps {
  children: React.ReactNode
  className?: string
}
const MobileVersion = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-1 right-1">
        <Dialog>
          <DialogTrigger>
            <div className="border p-1 h-4 w-4 text-gray-500">
              <Info />
            </div>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Future Feature</DialogTitle>
              <DialogDescription>This feature is not live and is here for proof of concept purposes.</DialogDescription>
            </DialogHeader>
            <DialogClose asChild>
              <Button className="w-full">Close</Button>
            </DialogClose>
          </DialogContent>
        </Dialog>
      </div>
      {children}
    </div>
  )
}


const DesktopVersion = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-1 right-1">
        <Popover>
          <PopoverTrigger>
            <div className="border p-1 text-gray-500 rounded-lg">
              <Info />
            </div>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Future Feature</PopoverTitle>
              <PopoverDescription>This feature is not live and is here for proof of concept purposes.</PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </div>
      {children}
    </div>
  )
}



const FutureFeatureWrapper = ({ children, className }: FutureFeatureWrapperProps) => {
  const mobile = useAppStore((f) => f.isMobile)
  return (
    mobile ? (
      <MobileVersion>{children}</MobileVersion>
    ) : (
      <DesktopVersion>{children}</DesktopVersion>
    )
  )
}

export default FutureFeatureWrapper

"use client"

import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

const SiteSearch = () => {
  return (
    <Dialog>
      <DialogTrigger>
        <Input className=" w-fit h-10" placeholder="Search anything..." />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Search Coolbills</DialogTitle>
          <DialogDescription>Search anything from bills to congress members</DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}

export default SiteSearch

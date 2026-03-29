"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatIsoDate } from "@/lib/utils/StringFunctions"
import { Permission } from "@prisma/client"
import { Edit, Loader, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"
import CreatePermission from "../[id]/components/CreatePermission"

interface AllPermissionsProps {
  permissions: Permission[]
}

const AllPermissions = ({ permissions }: AllPermissionsProps) => {
  const [clientPermissions, setClientPermissions] = useState<Permission[]>(permissions)
  const [updatePermission, setUpdatePermission] = useState<Permission | null>(null)
  const [updatedDescription, setUpdatedDescription] = useState<string>("")
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false)
  const [editOpen, setEditOpen] = useState<boolean>(false)
  const [updating, setUpdating] = useState<boolean>(false)
  const savePermission = async () => {
    try {
      const permissionId = updatePermission?.id
      setUpdating(true)
      const response: Response = await fetch("/api/admin/permissions", {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ permissionId, description: updatedDescription })
      })
      if (response?.ok) {
        clientUpdatePermission(permissionId)
      }

    } catch (error) {
      console.error("This went wrong", error)
    } finally {
      setUpdating(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const permissionId = updatePermission?.id
      setUpdating(true)
      const response: Response = await fetch("/api/admin/permissions", {
        method: "DELETE",
        credentials: "include",
        body: JSON.stringify({ permissionId })
      })
      if (response?.ok) {
        clientDeletePermission(permissionId)
      }

    } catch (error) {
      console.error("This went wrong", error)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (updatePermission) {
      setUpdatedDescription(updatePermission?.description)
    }
  }, [updatePermission])

  const clientUpdatePermission = (permissionId: number) => {
    const foundPermission = clientPermissions?.find((f) => f.id === permissionId)
    const newPermission = { ...foundPermission, description: updatedDescription }
    const newPermissions = clientPermissions?.map((perm) => perm?.id === permissionId ? newPermission : perm)
    setClientPermissions(newPermissions)
  }

  const clientDeletePermission = (permissionId: number) => {
    const newPermissions = clientPermissions?.filter((p) => p.id !== permissionId)
    setClientPermissions(newPermissions)
  }

  return (
    <div className="flex flex-col w-full justify-end gap-4">
      <div className="flex w-full justify-between items-center">
        <Label className="text-2xl">All Permissions</Label>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="w-fit self-end">Create Permission</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Permission</DialogTitle>
              <DialogDescription>Create a permission</DialogDescription>
            </DialogHeader>
            <CreatePermission />
          </DialogContent>
        </Dialog>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Permission Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientPermissions?.map((row, index) => <TableRow key={index} className={`${index % 2 === 0 ? "bg-muted" : ""} `}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.description}</TableCell>
            <TableCell>{formatIsoDate(row.createdAt)}</TableCell>
            <TableCell>{formatIsoDate(row.updatedAt)}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                disabled={updating}
                onClick={() => {
                  setEditOpen(true)

                  setUpdatePermission(row)
                }}  >
                {updating ? <Loader className="animate-spin" /> : <Edit />}
              </Button>
              <Button disabled={updating} onClick={() => {
                setDeleteOpen(true)
                setUpdatePermission(row)
              }} variant="destructive">
                {updating ? <Loader className="animate-spin" /> : <Trash2 />}
              </Button>
            </TableCell>
          </TableRow>
          )}
        </TableBody>
      </Table>
      {updatePermission ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="lg:min-w-4xl">
            <DialogHeader>
              <DialogTitle>Update Permission {updatePermission?.name} ?</DialogTitle>
              <DialogDescription>Updating this permission is will work. Nice.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <div>{updatePermission?.name}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Textarea
                  onKeyDown={(e) => {
                    if (
                      e.key === "Enter" && e.ctrlKey
                    ) {
                      setEditOpen(false)
                      savePermission()
                    }
                  }}
                  value={updatedDescription} onChange={(e) => setUpdatedDescription(e.target.value)} />
              </div>

            </div>
            <div className="h-14 grid gap-2 grid-cols-2 items-center">
              <DialogClose asChild>
                <Button variant="secondary" className="w-full h-full">Nevermind</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => savePermission()} className="w-full h-full">Save</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      ) : ""}

      {updatePermission ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="lg:min-w-4xl">
            <DialogHeader>
              <DialogTitle>Delete Permission {updatePermission?.name} ?</DialogTitle>
              <DialogDescription>Deleting this permission is perminent, just make a new one?</DialogDescription>
            </DialogHeader>
            <div className="h-14 grid gap-2 grid-cols-2 items-center">
              <DialogClose asChild>
                <Button variant="secondary" className="w-full h-full">Nevermind</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => confirmDelete()} variant="destructive" className="w-full h-full">Delete</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      ) : ""}
    </div>
  )
}

export default AllPermissions

"use client"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { formatIsoDate } from "@/lib/utils/StringFunctions"
import { Role } from "@prisma/client"
import { Edit, Loader, Trash2 } from "lucide-react"
import { useEffect, useState } from "react"

interface AllRolesProps {
  roles: Role[]
}

const AllRoles = ({ roles }: AllRolesProps) => {
  const [clientRoles, setClientRoles] = useState<Role[]>(roles)
  const [updateRole, setUpdateRole] = useState<Role | null>(null)
  const [updatedDescription, setUpdatedDescription] = useState<string>("")
  const [deleteOpen, setDeleteOpen] = useState<boolean>(false)
  const [editOpen, setEditOpen] = useState<boolean>(false)
  const [updating, setUpdating] = useState<boolean>(false)
  const saveRole = async () => {
    try {
      const roleId = updateRole?.id
      setUpdating(true)
      const response: Response = await fetch("/api/admin/roles", {
        method: "PATCH",
        credentials: "include",
        body: JSON.stringify({ roleId, description: updatedDescription })
      })
      if (response?.ok) {
        clientUpdateRole(roleId)
      }

    } catch (error) {
      console.error("This went wrong", error)
    } finally {
      setUpdating(false)
    }
  }

  const confirmDelete = async () => {
    try {
      const roleId = updateRole?.id
      setUpdating(true)
      const response: Response = await fetch("/api/admin/roles", {
        method: "DELETE",
        credentials: "include",
        body: JSON.stringify({ roleId })
      })
      if (response?.ok) {
        clientDeleteRole(roleId)
      }

    } catch (error) {
      console.error("This went wrong", error)
    } finally {
      setUpdating(false)
    }
  }

  useEffect(() => {
    if (updateRole) {
      setUpdatedDescription(updateRole?.description)
    }
  }, [updateRole])

  const clientUpdateRole = (roleId: number) => {
    const foundRole = clientRoles?.find((f) => f.id === roleId)
    const newRole = { ...foundRole, description: updatedDescription }
    const newRoles = clientRoles?.map((role) => role.id === roleId ? newRole : role)
    setClientRoles(newRoles)
  }

  const clientDeleteRole = (roleId: number) => {
    const newRoles = clientRoles?.filter((p) => p.id !== roleId)
    setClientRoles(newRoles)
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Role Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Updated At</TableHead>
            <TableHead className="w-20"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {clientRoles?.map((row, index) => <TableRow key={index} className={`${index % 2 === 0 ? "bg-muted" : ""} `}>
            <TableCell>{row.name}</TableCell>
            <TableCell>{row.description}</TableCell>
            <TableCell>{formatIsoDate(row.createdAt)}</TableCell>
            <TableCell>{formatIsoDate(row.updatedAt)}</TableCell>
            <TableCell className="flex gap-2">
              <Button
                disabled={updating}
                onClick={() => {
                  setEditOpen(true)

                  setUpdateRole(row)
                }}  >
                {updating ? <Loader className="animate-spin" /> : <Edit />}
              </Button>
              <Button disabled={updating} onClick={() => {
                setDeleteOpen(true)
                setUpdateRole(row)
              }} variant="destructive">
                {updating ? <Loader className="animate-spin" /> : <Trash2 />}
              </Button>
            </TableCell>
          </TableRow>
          )}
        </TableBody>
      </Table>
      {updateRole ? (
        <Dialog open={editOpen} onOpenChange={setEditOpen}>
          <DialogContent className="lg:min-w-4xl">
            <DialogHeader>
              <DialogTitle>Update Role {updateRole?.name} ?</DialogTitle>
              <DialogDescription>Updating this role is will work. Nice.</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-2">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <div>{updateRole?.name}</div>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Description</Label>
                <Textarea onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    setEditOpen(false)
                    saveRole()
                  }
                }} value={updatedDescription} onChange={(e) => setUpdatedDescription(e.target.value)} />
              </div>

            </div>
            <div className="h-14 grid gap-2 grid-cols-2 items-center">
              <DialogClose asChild>
                <Button variant="secondary" className="w-full h-full">Nevermind</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={() => saveRole()} className="w-full h-full">Save</Button>
              </DialogClose>
            </div>
          </DialogContent>
        </Dialog>
      ) : ""}

      {updateRole ? (
        <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
          <DialogContent className="lg:min-w-4xl">
            <DialogHeader>
              <DialogTitle>Delete Role {updateRole?.name} ?</DialogTitle>
              <DialogDescription>Deleting this role is perminent, just make a new one?</DialogDescription>
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

export default AllRoles

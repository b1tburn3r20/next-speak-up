
"use client"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import LoginForm from "@/components/login-form";
import { useLoginStore } from "@/app/navbar/useLoginStore";


export const LoginSignupModal = () => {
  const isLoginDialogOpen = useLoginStore((f) => f.isLoginDialogOpen);
  const setIsLoginDialogOpen = useLoginStore((f) => f.setIsLoginDialogOpen)
  return (
    <Dialog open={isLoginDialogOpen} onOpenChange={setIsLoginDialogOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Login/Signup with Google</DialogTitle>
        </DialogHeader>
        <LoginForm />
      </DialogContent>
    </Dialog>
  )
}


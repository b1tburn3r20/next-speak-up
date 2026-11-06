"use client";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import PasswordLoginForm from "./password-login-form";

interface LoginFormProps {
  mode?: string;
}

const LoginForm = ({ mode }: LoginFormProps) => {
  const searchParams = useSearchParams();

  const handleGoogleSignin = async () => {
    const callbackUrl =
      searchParams.get("callbackUrl") ||
      window.location.origin + window.location.pathname;

    await signIn("google", { callbackUrl });
  };

  return (
    <Tabs defaultValue="coolbills">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="coolbills">Coolbills Login</TabsTrigger>
        <TabsTrigger value="providers">Google</TabsTrigger>
      </TabsList>

      <TabsContent value="coolbills">
        <PasswordLoginForm initialMode={mode === "Sign up" ? "signup" : "login"} />
      </TabsContent>
      <TabsContent className="space-y-2" value="providers">
        <Button
          type="button"
          variant="secondary"
          size="lg"
          className="w-full text-foreground"
          aria-label="Sign in with Google"
          onClick={handleGoogleSignin}
        >
          <img
            className="w-6 h-6"
            src="https://www.svgrepo.com/show/475656/google-color.svg"
            loading="lazy"
            alt=""
          />
          <span>{mode ? mode : "Sign in"} with Google</span>
        </Button>
      </TabsContent>
    </Tabs>
  );
};

export default LoginForm;

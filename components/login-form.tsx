"use client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { useSearchParams } from "next/navigation";

import { signIn } from "next-auth/react";
interface LoginFormProps {
  mode?: string
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
    <Tabs defaultValue="providers">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="providers">Providers</TabsTrigger>
        <TabsTrigger disabled value="Coolbills">
          Coolbills Login
        </TabsTrigger>
      </TabsList>

      <TabsContent className="space-y-2" value="providers">
        <p className="p-4 bg-muted rounded-lg ">
          For now we only have signin available via Google, more methods will be
          added over time.
        </p>
        <button
          aria-label="Sign in with Google"
          onClick={handleGoogleSignin}
          className="px-4 py-2 bg-background-light shadow-md flex gap-2 rounded-lg text-slate-700 dark:text-slate-200 hover:border-slate-400 dark:hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300 hover:shadow transition duration-150 w-full items-center">
          <img className="w-6 h-6" src="https://www.svgrepo.com/show/475656/google-color.svg" loading="lazy" alt="google logo" />
          <span>{mode ? mode : "Sign in"} with Google</span>
        </button>
      </TabsContent>
      <TabsContent value="Coolbills">sorry but inspect element didnt reveal much i havent developed this yet</TabsContent>
    </Tabs>
  );
};

export default LoginForm;

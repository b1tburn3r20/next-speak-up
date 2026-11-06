"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

type Mode = "login" | "signup";

const PasswordLoginForm = ({ initialMode = "login" }: { initialMode?: Mode }) => {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>(initialMode);
  const [identifier, setIdentifier] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const isSignup = mode === "signup";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/account/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup ? { username, email, password } : { identifier, password },
        ),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Something went wrong. Please try again.");
        setSubmitting(false);
        return;
      }
      // A full page load, so SessionProvider picks up the new session cookie.
      window.location.assign(
        searchParams.get("callbackUrl") ?? window.location.href,
      );
    } catch {
      setError("We couldn't reach the server. Check your connection and retry.");
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 font-normal">
      {isSignup ? (
        <>
          <div className="space-y-1">
            <Label htmlFor="signup-username">Username</Label>
            <Input
              id="signup-username"
              autoComplete="username"
              required
              minLength={3}
              maxLength={30}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="signup-email">Email</Label>
            <Input
              id="signup-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
        </>
      ) : (
        <div className="space-y-1">
          <Label htmlFor="login-identifier">Username or email</Label>
          <Input
            id="login-identifier"
            autoComplete="username"
            required
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
          />
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="auth-password">Password</Label>
        <Input
          id="auth-password"
          type="password"
          autoComplete={isSignup ? "new-password" : "current-password"}
          required
          minLength={isSignup ? 8 : undefined}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </div>
      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "One moment…" : isSignup ? "Create account" : "Log in"}
      </Button>
      <Button
        type="button"
        variant="link"
        className="w-full font-bold whitespace-normal underline"
        onClick={() => {
          setMode(isSignup ? "login" : "signup");
          setError(null);
        }}
      >
        {isSignup ? "Already have an account? Log in" : "New here? Create an account"}
      </Button>
    </form>
  );
};

export default PasswordLoginForm;

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { signInSchema, signUpSchema, type SignInInput, type SignUpInput } from "@/lib/schemas/auth";

export function LoginForm() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const signInForm = useForm<SignInInput>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  const signUpForm = useForm<SignUpInput>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { storeName: "", fullName: "", email: "", password: "" },
  });

  async function onSignIn(values: SignInInput) {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword(values);
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function onSignUp(values: SignUpInput) {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { store_name: values.storeName, full_name: values.fullName },
      },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Account created — check your email to confirm, then sign in.");
    setMode("signin");
  }

  async function onGoogle() {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }

  return (
    <div className="mt-6">
      <div className="flex w-full rounded-pill bg-surface-strong p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={cn(
            "flex-1 rounded-pill py-1.5 text-sm font-medium transition-colors",
            mode === "signin" ? "bg-canvas text-ink shadow-sm" : "text-body"
          )}
        >
          Sign in
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={cn(
            "flex-1 rounded-pill py-1.5 text-sm font-medium transition-colors",
            mode === "signup" ? "bg-canvas text-ink shadow-sm" : "text-body"
          )}
        >
          Sign up
        </button>
      </div>

      {mode === "signin" ? (
        <form onSubmit={signInForm.handleSubmit(onSignIn)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...signInForm.register("email")} />
            {signInForm.formState.errors.email && (
              <p className="text-xs text-down">{signInForm.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...signInForm.register("password")} />
            {signInForm.formState.errors.password && (
              <p className="text-xs text-down">
                {signInForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Sign in
          </Button>
        </form>
      ) : (
        <form onSubmit={signUpForm.handleSubmit(onSignUp)} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="storeName">Store name</Label>
            <Input id="storeName" {...signUpForm.register("storeName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Your name</Label>
            <Input id="fullName" {...signUpForm.register("fullName")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signupEmail">Email</Label>
            <Input id="signupEmail" type="email" {...signUpForm.register("email")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="signupPassword">Password</Label>
            <Input id="signupPassword" type="password" {...signUpForm.register("password")} />
            {signUpForm.formState.errors.password && (
              <p className="text-xs text-down">
                {signUpForm.formState.errors.password.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            Sign up
          </Button>
        </form>
      )}

      <div className="mt-4 flex items-center gap-3">
        <div className="h-px flex-1 bg-hairline" />
        <span className="text-xs text-muted">or</span>
        <div className="h-px flex-1 bg-hairline" />
      </div>

      <Button variant="outline" className="mt-4 w-full" onClick={onGoogle} type="button">
        Continue with Google
      </Button>
    </div>
  );
}

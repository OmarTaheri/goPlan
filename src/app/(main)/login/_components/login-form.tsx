"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";

const FormSchema = z.object({
  username: z.string().min(1, { message: "Username is required." }),
  password: z.string().min(1, { message: "Password is required." }),
});

const demoCredentials = [
  { role: "Admin", user: "admin", pass: "Password123!" },
  { role: "Advisor (SSE)", user: "advisor_sse", pass: "Password123!" },
  // CS Students
  { role: "CS Senior (Omar)", user: "cs_senior_omar", pass: "Password123!" },
  { role: "CS Freshman (Ismail)", user: "cs_freshman_ismail", pass: "Password123!" },
];

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: data.username, password: data.password }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || "Login failed");
        setLoading(false);
        return;
      }

      // Store access token in localStorage
      localStorage.setItem("access_token", result.access_token);

      // Redirect based on role
      const dashboardMap: Record<string, string> = {
        ADMIN: "/dashboard/admin",
        STUDENT: "/dashboard/student",
        ADVISOR: "/dashboard/advisor",
      };

      const redirectPath = dashboardMap[result.user.role] || "/dashboard";
      router.push(redirectPath);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  const fillCredentials = (user: string, pass: string) => {
    form.setValue("username", user);
    form.setValue("password", pass);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username or Email</FormLabel>
                <FormControl>
                  <Input
                    id="username"
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </Button>
        </form>
      </Form>

      <Card className="bg-muted/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Demo Credentials</CardTitle>
          <CardDescription className="text-xs">Click to fill credentials</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2">
          {demoCredentials.map((cred) => (
            <Button
              key={cred.user}
              variant="ghost"
              size="sm"
              className="h-auto justify-start px-2 py-1.5 text-left font-normal"
              onClick={() => fillCredentials(cred.user, cred.pass)}
            >
              <span className="font-medium">{cred.role}:</span>
              <span className="text-muted-foreground ml-1">{cred.user}</span>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

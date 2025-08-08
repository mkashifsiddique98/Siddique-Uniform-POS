"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    if (!isLoading) {
      setDots(".");
      return;
    }
    const interval = setInterval(() => {
      setDots((prev) => (prev.length < 3 ? prev + "." : "."));
    }, 500);
    return () => clearInterval(interval);
  }, [isLoading]);
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true)
    // Basic form validation
    if (!email || !password) {
      setErrorMsg("Email and password are required.");
      setIsLoading(false)
      return;
    }

    setErrorMsg(""); // ----> reset

    const res = await fetch("/api/users/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await res.json();
      setIsLoading(false)
    if (res.ok) {
    
      router.push("/pos");
      console.log("login")
    } else {
      
      setErrorMsg(response.error || "Login failed. Please try again.");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-col items-center">
          <Image
            src="/image/logo/uniform.png"
            width={80}
            height={80}
            alt="Siddique Uniform"
            className="rounded-full shadow-xl border"
          />
          <CardTitle className="text-center mt-2 text-xl font-bold">
            Welcome to Siddique Uniform
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </div>

               <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? `Logining${dots}` : "Login"}
            </Button>

            {errorMsg && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

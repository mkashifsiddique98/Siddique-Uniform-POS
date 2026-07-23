"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton"; // ⬅️ Import Skeleton
import { User } from "@/types/user";

export default function ProfilePage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }
   const userInfo = {...user,password}
   console.log(userInfo)
    try {
      const res = await fetch(`/api/users/${userInfo?._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userInfo),
      });

      if (!res.ok) throw new Error("Failed to update password");

      toast({ title: "Password updated successfully!" });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({ title: "Error updating password", variant: "destructive" });
    }
  };

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/users/user-info");
        if (res.ok) {
          const data = await res.json();
          setUser(data);
          console.log(data)
        }
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  return (
    <div className="container p-6">
      <Card className="max-w-[100%] mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading Skeletons */}
          {loading ? (
            <>
              <div className="mb-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="mb-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="mb-4 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
              <hr className="my-4" />
              <div className="mb-4 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
              <div className="mb-4 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-10 w-full" />
              </div>
              <Skeleton className="h-10 w-full mt-4" />
            </>
          ) : user ? (
            <>
              <div className="mb-4">
                <Label>Name</Label>
                <Input value={user.name} disabled />
              </div>
              <div className="mb-4">
                <Label>Email</Label>
                <Input value={user.email} disabled />
              </div>
              <div className="mb-4">
                <Label>Role</Label>
                <Input value={user.role} disabled />
              </div>

              <hr className="my-4" />

              <div className="mb-4">
                <Label>New Password</Label>
                <Input
                  type="password"
                  placeholder="Enter new password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <Label>Confirm Password</Label>
                <Input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>

              <Button className="w-full" onClick={handleChangePassword}>
                Update Password
              </Button>
            </>
          ) : (
            <p className="text-center text-red-500">Failed to load user data.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

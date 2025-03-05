"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";

const userData = {
  name: "Muhammad Kashif Siddique",
  email: "your-email@example.com",
  role: "Admin",
};

export default function ProfilePage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleChangePassword = async () => {
    if (password !== confirmPassword) {
      toast({ title: "Passwords do not match", variant: "destructive" });
      return;
    }

    try {
      const res = await fetch("/api/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!res.ok) throw new Error("Failed to update password");

      toast({ title: "Password updated successfully!" });
      setPassword("");
      setConfirmPassword("");
    } catch (error) {
      toast({ title: "Error updating password", variant: "destructive" });
    }
  };

  return (
    <div className="container p-6">
      <Card className="max-w-[100%] mx-auto">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Label>Name</Label>
            <Input value={userData.name} disabled />
          </div>
          <div className="mb-4">
            <Label>Email</Label>
            <Input value={userData.email} disabled />
          </div>
          <div className="mb-4">
            <Label>Role</Label>
            <Input value={userData.role} disabled />
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
        </CardContent>
      </Card>
    </div>
  );
}

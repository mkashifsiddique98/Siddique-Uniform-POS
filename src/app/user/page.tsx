// app/user-management/page.tsx or similar

import { Card, CardContent } from "@/components/ui/card";
import { User } from "@/types/user";
import BreadCrum from "@/components/custom-components/bread-crum";
import UserTable from "./UserTable";
import { cookies } from "next/headers";

async function getUsers(): Promise<User[]> {
  try {
    const cookieHeader = cookies().toString();
    const baseUrl = process.env.DOMAIN_NAME || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/users`, {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch users");
    return res.json();
  } catch (error) {
    console.error("Error fetching users:", error);
    return [];
  }
}

export default async function UserManagementPage() {
  const users = await getUsers();

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="User" subfolder="User Management" />
      <Card className="p-2">
        <CardContent>
          <UserTable userData={users} />
        </CardContent>
      </Card>
    </div>
  );
}

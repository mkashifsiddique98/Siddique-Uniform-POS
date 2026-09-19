// app/user-management/page.tsx or similar

import { Card, CardContent } from "@/components/ui/card";
import { User } from "@/types/user";
import BreadCrum from "@/components/custom-components/bread-crum";
import UserTable from "./UserTable";
import { cookies } from "next/headers";
import { serverApiUrl } from "@/lib/serverFetch";

async function getUsers(): Promise<User[]> {
  try {
    const cookieHeader = cookies().toString();
    const res = await fetch(serverApiUrl("/api/users"), {
      cache: "no-store",
      headers: {
        Cookie: cookieHeader,
      },
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({})) as { error?: string };
      throw new Error(body.error || `Failed to fetch users (HTTP ${res.status})`);
    }
    const data = await res.json() as User[];
    return Array.isArray(data) ? data : [];
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

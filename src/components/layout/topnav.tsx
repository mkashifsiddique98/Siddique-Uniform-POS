"use client";
import { Bell, BellRing, Expand, Menu, Search } from "lucide-react";
import { UserNav } from "../dashboard/user-nav";
import { toggleFullScreen } from "@/utils/screenUtils";
import { Button } from "../ui/button";
import { AlertNav } from "../custom-components/alert-nav";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

export function Topnav({
  handleToggleSidebar,
}: {
  handleToggleSidebar?: () => void;
}) {
  const handleFullScreen = () => {
    toggleFullScreen();
  };
  const pathName = usePathname();
  const route = useRouter();

  const [loading, setLoading] = useState(false);

  const handleUpdate = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/setting", {
        method: "POST",
      });

      if (response.ok) {
        const data = await response.json();
      }
    } catch (error: any) {
      console.log("Error", error);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="border-b shadow-md z-50">
      <div className="flex h-16 items-center px-4 justify-between w-full ">
        {/* <TeamSwitcher /> */}
        <Avatar
          className="ml-2 h-12 w-12  mr-5 border cursor-pointer"
          onClick={() => route.push("/")}
        >
          <AvatarImage src="/73804159Siddique.png" alt="@Siddique" />
          <AvatarFallback>SU</AvatarFallback>
        </Avatar>
        {pathName !== "/pos" && (
          <div>
            <div onClick={handleToggleSidebar}>
              <Menu className="ml-4 cursor-pointer" />
            </div>
          </div>
        )}
        <div className="ml-auto flex items-center space-x-4">
          {pathName !== "/pos" && (
            <div>
              <Button
                onClick={() => route.push("/pos")}
                className="bg-white shadow-md hover:bg-black  hover:text-white"
                variant="outline"
              >
                POS
              </Button>
              <Button onClick={handleUpdate} className="ml-1" size={"sm"} disabled={loading}>
                {loading ? "Updating..." : "Update Software"}
              </Button>
            </div>
          )}
          <div
            onClick={handleFullScreen}
            className="cursor-pointer  hover:bg-gray-100 p-2 rounded-md hidden md:block"
          >
            <Expand />
          </div>
          {pathName !== "/pos" && (
            <div>
              <AlertNav />
            </div>
          )}
          <UserNav />
        </div>
      </div>
    </div>
  );
}

"use client";
import { Bell, Expand, Menu } from "lucide-react";
import { UserNav } from "../dashboard/user-nav";
import { toggleFullScreen } from "@/utils/screenUtils";
import { AlertNav } from "../custom-components/alert-nav";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import ToggleMode from "../custom-components/mode-switch";
import HealthButton from "../custom-components/System-health";

const DateTimeDisplay = dynamic(() => import("./DateTimeDisplay"), {
  ssr: false, // Disable server-side rendering for this component
});

//  main
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

  return (
    <div className="border-b shadow-md z-50 relative">
      <div className="flex justify-between items-center h-16 px-4 w-full">
        <div className="flex items-center">
          <Link href={"/"}>
            <Avatar className="ml-2 h-12 w-12 mr-5 border cursor-pointer">
              <AvatarImage src="/73804159Siddique.png" alt="@Siddique" />
              <AvatarFallback>SU</AvatarFallback>
            </Avatar>

          </Link>
         {pathName !== "/pos" && (
            <div>
              <div onClick={handleToggleSidebar}>
                <Menu className="ml-4 cursor-pointer" />
              </div>
            </div>
          )}
        </div>
        {/* Health status buttons */}
       <div>
        <HealthButton compact />
         {/* Centered Date and Time */}
          {pathName !== "/pos" && (
            <DateTimeDisplay />
          )}
       </div>
      
    <div className="ml-auto flex items-center space-x-4">
          {pathName !== "/pos" && (
            <div className="flex items-center gap-2">
              <Link
                href="/pos"
                className="bg-white text-black hover:bg-gray-900 hover:text-white px-4 py-2 rounded-lg shadow-lg border border-gray-300 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50"
              >
                POS
              </Link>
            </div>
          )}
          {pathName === "/pos" && <ToggleMode />}
          <div
            onClick={handleFullScreen}
            className="cursor-pointer hover:bg-gray-100 p-2 rounded-md hidden md:block"
          >
            <Expand />
          </div>
          <AlertNav />
          
          <UserNav />
        </div>
      </div>
    </div>
  );
}

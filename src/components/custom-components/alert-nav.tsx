import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, BellRingIcon, LayoutList } from "lucide-react";
import Link from "next/link";

export function AlertNav() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative hover:bg-gray-100 p-2 rounded-md cursor-pointer">
          <Bell />
          <span className="absolute top-1 right-1 bg-black h-[13px] w-[13px] text-white rounded-full  text-[8px] text-center">
            1
          </span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-64 cursor-pointer "
        align="end"
        forceMount
      >
        <DropdownMenuLabel className="font-normal">
          <div className="flex justify-evenly items-center">
            <div className="pr-2 border-r-2">
              <BellRingIcon />
            </div>
            <p className="text-sm font-medium leading-none">
              Kashif- Due-<span>(04/21/2025)</span>
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuLabel className="flex justify-evenly items-center border-t-2  hover:bg-slate-200">
          <Link
            href={"/notification"}
            className="text-center font-extrabold"
          >
            Show-More
          </Link>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

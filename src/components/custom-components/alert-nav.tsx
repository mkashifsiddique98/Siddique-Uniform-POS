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
import { Bell, BellRingIcon } from "lucide-react";

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
          <div className="flex justify-between items-center">
            <div className="pr-4 border-r-2">
              <BellRingIcon />
            </div>
            <p className="text-sm font-medium leading-none">
              {" "}
              Move to Dashboard
            </p>
          </div>
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

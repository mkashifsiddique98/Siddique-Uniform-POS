"use client"; // components/SidebarNav.js
import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface SidebarNavItem {
  href: string;
  title: string;
  icon: JSX.Element;
  subItems?: SidebarNavItem[];
}

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
  items: SidebarNavItem[];
}

export function SidebarNav({ items, ...props }: SidebarNavProps) {
  const pathname = usePathname();
  // Work on highligh fn
  const pathSegments = pathname.split("/").filter(Boolean);
  const mainPath = "/" + pathSegments[0] ? "" : pathSegments[0];
  const subPath = "/" + pathSegments[1] ? "" : pathSegments[1];
  // console.log("mainPath", mainPath, "\n subPath", subPath);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleHover = (title: string) => {
    setOpenDropdown(title);
  };

  const handleLeave = () => {
    setOpenDropdown(null);
  };

  const renderNavItem = (item: SidebarNavItem) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;

    const handleItemClick = () => {
      setOpenDropdown(item.title);
    };

    return (
      <li
        key={item.title}
        onMouseEnter={() => handleHover(item.title)}
        className="border-b py-2"
      >
        {" "}
        <Link href={item.href}>
          <div
            onClick={handleItemClick}
            className={cn(
              "flex flex-col items-center p-2 text-gray-900  rounded-md group hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700",
              {
                "bg-gray-100 dark:bg-gray-700": mainPath === item.href,
              }
            )}
          >
            {item.icon}
            <span className="mt-1">{item.title}</span>
          </div>
        </Link>
        <div>
          {hasSubItems && (
            <div
              onMouseLeave={handleLeave}
              className={`shadow-md absolute top-0 left-full mt-0 p-1 pt-6 w-48  border-r h-full bg-white dark:bg-gray-700 ${
                openDropdown === item.title ? "block" : "hidden"
              }`}
            >
              <ul className="space-y-3">
                {item.subItems?.map((subItem) => (
                  <li
                    key={subItem.title}
                    className="hover:bg-gray-100 dark:text-white dark:hover:bg-gray-700"
                  >
                    <Link
                      href={subItem.href}
                      className={cn(
                        "flex justify-start w-full  text-gray-900 transition duration-75  p-2 group",
                        {
                          "bg-gray-100 dark:bg-gray-700":
                            subPath === subItem.href,
                        }
                      )}
                    >
                      <span className="mr-3">{subItem.icon}</span>
                      {subItem.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </li>
    );
  };

  return (
    <nav>
      <aside className="shadow-lg border-r relative top-0 left-0 z-40 w-32 h-screen transition-transform">
        <div className="h-full px-3 py-4 overflow-y-auto">
          <ul className="space-y-2 font-medium cursor-pointer ">
            {items.map((item) => renderNavItem(item))}
          </ul>
        </div>
      </aside>
    </nav>
  );
}

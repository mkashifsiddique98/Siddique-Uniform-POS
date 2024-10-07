"use client";
import React, { useState } from "react";
import { SidebarNav } from "./sidebar";
import { Topnav } from "./topnav";
import { sidebarItems } from "@/constant/sidebar";
import { usePathname } from "next/navigation";
import { Provider } from "react-redux";
import { store } from "@/lib/store";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const MasterLayout = ({ children }: { children: React.ReactNode }) => {
  const [showSideBar, setShowSideBar] = useState<boolean>(true);
  const handleToggleSidebar = () => {
    setShowSideBar(!showSideBar);
  };
  const pathname = usePathname();

  return (
    <Provider store={store}>
      {/* Uncomment if you need the QueryClientProvider */}
      {/* <QueryClientProvider client={queryClient}> */}
      <div className="flex h-screen flex-col">
        {pathname === "/pos" ? (
          <div>{children}</div>
        ) : (
          <div>
            <Topnav handleToggleSidebar={handleToggleSidebar} />

            <div className="flex h-[80vh] overflow-hidden">
              {/*----------- Side-bar -----------*/}
              {showSideBar && (
                <aside >
                  <SidebarNav items={sidebarItems} />
                </aside>
              )}
              {/*------------------- Main Content -------------*/}
              <div className="flex-1 overflow-x-hidden overflow-y-auto">
                {children}
              </div>
            </div>
          </div>
        )}
      </div>
      {/* </QueryClientProvider> */}
    </Provider>
  );
};

export default MasterLayout;

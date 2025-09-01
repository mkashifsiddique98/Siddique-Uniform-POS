import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import MasterLayout from "@/components/layout";
import NextTopLoader from "nextjs-toploader";
import type { Metadata } from "next";
import { usePathname } from "next/navigation";

// Route Protected
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { redirect } from "next/navigation";
// const roboto = Roboto({ subsets: ['cyrillic']})
export const metadata: Metadata = {
  title: "Siddique Unifrom & Factory",
  description: "Point of Sale",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  
  //  const token = cookies().get("token")?.value;
  
  //  if (!token) {
  //     redirect("/login");
  //   }
  
  //   try {
  //     jwt.verify(token, process.env.JWT_SECRET!);
  //   } catch (error) {
  //     redirect("/login");
  //   }
  return (
    <html lang="en" className="scroll-smooth focus:scroll-auto" suppressHydrationWarning={true}>
      <body>
        <NextTopLoader
          color="#0f172a"
          initialPosition={0.08}
          showSpinner={false}
          crawlSpeed={200}
          speed={200}
          height={7}
          
        />
        <MasterLayout>
          {children}
          </MasterLayout>
        <Toaster />
      </body>
    </html>
  );
}

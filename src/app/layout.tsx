import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import MasterLayout from "@/components/layout";
import NextTopLoader from "nextjs-toploader";

const inter = Inter({ subsets: ["latin"] });
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
  return (
    <html lang="en" className="scroll-smooth focus:scroll-auto">
      <body className={inter.className}>
        <NextTopLoader
          color="#0f172a"
          showSpinner={false}
          crawlSpeed={200}
          speed={200}
        />
        <MasterLayout>{children}</MasterLayout>
        <Toaster />
      </body>
    </html>
  );
}

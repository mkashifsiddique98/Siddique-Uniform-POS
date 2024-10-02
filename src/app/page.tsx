import { Metadata } from "next";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
import { Overview } from "@/components/dashboard/overview";
import { RecentSales } from "@/components/dashboard/recent-sales";
import { ProductFormState } from "@/types/product";
import LOWSTOCK from "@/components/dashboard/low-stock";
import Link from "next/link";
const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

async function getAllProductData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/product`, {
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return null; // Return an empty array to handle missing data gracefully
  }
}

export const metadata: Metadata = {
  title: "Dashboard",
  description: "dashboard app.",
};
async function getAllInvoiceDetail() {
  try {
    const res = await fetch(
      `${process.env.DOMAIN_NAME}/api/invoice/`
        , {
        cache: "no-store",
      }
    );
    if (!res.ok) {
      getAllInvoiceDetail();
    }

    return res.json();
  } catch (error) {
    console.error(error);
    return { response: [] };
  }
}
const calculateMonthSales = (invoices: any[], year: number, month: number) => {
  // Filter invoices for the given month and year
  const filteredInvoices = invoices.filter((invoice) => {
    const invoiceDate = new Date(invoice.invoiceDate);
    return (
      invoiceDate.getFullYear() === year &&
      invoiceDate.getMonth() === month
    );
  });

  // Calculate total sales for the given month
  const totalSales = filteredInvoices.reduce(
    (acc, invoice) => acc + invoice.grandTotal,
    0
  );

  return totalSales;
};

const calculateCurrentAndPreviousMonthSales = (invoices: any[]) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0 is January, 11 is December

  // Calculate sales for the current month
  const currentMonthSales = calculateMonthSales(invoices, currentYear, currentMonth);

  // Handle the previous month logic (if current month is January, go to December of the previous year)
  let previousYear = currentYear;
  let previousMonth = currentMonth - 1;

  if (previousMonth < 0) {
    previousMonth = 11; // December of the previous year
    previousYear = currentYear - 1;
  }

  // Calculate sales for the previous month
  const previousMonthSales = calculateMonthSales(invoices, previousYear, previousMonth);

  // Calculate the percentage increase or decrease
  let percentageChange = 0;
  if (previousMonthSales > 0) {
    percentageChange = ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100;
  }

  return {
    currentMonthSales,
    previousMonthSales,
    percentageChange,
  };
};



export default async function DashboardPage() {
  const data = await getAllInvoiceDetail();
  const { response:InvoiceData } = data;
  const dataProduct = await getAllProductData();
  const productResponse: ProductFormState[] = dataProduct?.response || [];
  // Current Month Sales 

  const { currentMonthSales, percentageChange } = calculateCurrentAndPreviousMonthSales(InvoiceData);

  return (
    <>
      <div className="md:hidden">
        <Image
          src="/examples/dashboard-light.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="block dark:hidden"
        />
        <Image
          src="/examples/dashboard-dark.png"
          width={1280}
          height={866}
          alt="Dashboard"
          className="hidden dark:block"
        />
      </div>
      <div className="hidden flex-col md:flex">
        <div className="flex-1 space-y-4 p-8 pt-6">
          <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <div className="flex items-center space-x-2">
              <CalendarDateRangePicker />
              <Button>Download</Button>
            </div>
          </div>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="analytics" disabled>
                Analytics
              </TabsTrigger>
              <TabsTrigger value="reports" disabled>
                Reports
              </TabsTrigger>
              {/* <TabsTrigger value="notifications" disabled>
                Notifications
              </TabsTrigger> */}
            </TabsList>
            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total Revenue
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rs 45,231.89</div>
                    <p className="text-xs text-muted-foreground">
                      +19% from last month
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Purchase
                    </CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rs 2350</div>
                    <p className="text-xs text-muted-foreground">
                      +180.1% from last month
                    </p>
                  </CardContent>
                </Card>
                <Link href={"/invoice"}>
                <Card className="cursor-pointer">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      className="h-4 w-4 text-muted-foreground"
                    >
                      <rect width="20" height="14" x="2" y="5" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">Rs {currentMonthSales}</div>
                    <p className="text-xs text-muted-foreground">
                    {percentageChange.toFixed(2)}% from last month
                    </p>
                  </CardContent>
                </Card>
                </Link>
                <LOWSTOCK productResponse={productResponse}/>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader>
                    <CardTitle>Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="pl-2">
                    <Overview InvoiceData={InvoiceData}/>
                  </CardContent>
                </Card>
                <Card className="col-span-3">
                  <CardHeader>
                    <CardTitle>Recent Sales</CardTitle>
                    <CardDescription>
                      You made {InvoiceData.length} sales this month.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* {response.map((sale,index)=>(
                    <RecentSales key={index} sale={sale}  />
                  ))} */}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}

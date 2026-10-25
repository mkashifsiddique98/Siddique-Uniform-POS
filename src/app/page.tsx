import { Metadata } from "next";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
import { DownloadButton } from "@/components/dashboard/download-button";
import dynamic from "next/dynamic";
import { RecentSales } from "@/components/dashboard/recent-sales";
import LOWSTOCK from "@/components/dashboard/low-stock";
import Link from "next/link";

// recharts-based widgets are split into their own chunks
const Overview = dynamic(() =>
  import("@/components/dashboard/overview").then((m) => m.Overview)
);
const HorizontalBarChart = dynamic(
  () => import("@/components/dashboard/horizontal-bar-chart")
);
const MonthlyOverview = dynamic(() =>
  import("@/components/dashboard/month-overview").then((m) => m.MonthlyOverview)
);
const ExpenseOverview = dynamic(
  () => import("@/components/dashboard/expense-overview")
);
const LiveTrackProduct = dynamic(
  () => import("@/components/dashboard/live-track-product")
);
const ZakatOverview = dynamic(
  () => import("@/components/dashboard/zakat-overview")
);
import { calculateZakat } from "@/lib/zikat";
import { serverFetch } from "@/lib/serverFetch";
import { getDashboardKpis } from "@/lib/dashboardKpis";

interface DateRange {
  from?: Date;
  to?: Date;
}

async function fetchData(url: string) {
  try {
    const endpoint = url.replace(process.env.DOMAIN_NAME || "http://localhost:3000", "");
    const res = await serverFetch(endpoint, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return null;
  }
}

async function getAllProductData() {
  return await fetchData("/api/product");
}

async function getAllInvoiceDetail() {
  return await fetchData("/api/invoice");
}

export async function getAllExpenseDetail() {
  try {
    const [utilizeRes, categoriesRes] = await Promise.all([
      serverFetch("/api/utilize"),
      serverFetch("/api/utilize/expense-categories"),
    ]);

    if (!utilizeRes.ok || !categoriesRes.ok) {
      throw new Error("Failed to fetch utilize or categories");
    }

    const [utilizeData, categoryData] = await Promise.all([
      utilizeRes.json(),
      categoriesRes.json(),
    ]);

    const categoryMap = categoryData.reduce((acc: Record<string, string>, category: any) => {
      acc[category._id] = category.name;
      return acc;
    }, {});

    return utilizeData.map((item: any) => ({
      ...item,
      category: categoryMap[item.category] || "Unknown Category",
    }));
  } catch (error) {
    console.error("Server Fetch Error:", error);
    return [];
  }
}

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard app.",
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;

  const dateRange: DateRange = {
    from: from ? new Date(from) : undefined,
    to: to ? new Date(to) : undefined,
  };

  const [invoiceRes, productRes, kpis, expenses] = await Promise.all([
    getAllInvoiceDetail(),
    getAllProductData(),
    getDashboardKpis(dateRange),
    getAllExpenseDetail(),
  ]);
  const { response: InvoiceData } = invoiceRes || { response: [] };
  const { response: productResponse } = productRes || { response: [] };

  const {
    currentMonthSales,
    percentageChange,
    totalCurrentMonth,
    percentageChangePurchase,
    totalCurrentMonthRevenue,
    percentageChangeRevenue,
    totalReceivables,
  } = kpis;

  const inventoryOnly = calculateZakat(productResponse, [], 0);
  const zakatBase = inventoryOnly.totalInventoryValue + totalReceivables;
  const zakatMetrics = {
    ...inventoryOnly,
    totalReceivables,
    zakatBase,
    zakatPayable: Math.max(0, zakatBase * 0.025),
  };

  return (
    <div className="hidden flex-col md:flex">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker />
            <DownloadButton data={InvoiceData} filename="sales-invoices.csv" />
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="live-product-sale-check">
              Live Product Sale Check
            </TabsTrigger>
            <TabsTrigger value="zikat">Zakat Calculation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:border-black">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    Rs {totalCurrentMonthRevenue.toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {percentageChangeRevenue.toFixed(2)}% from last month
                  </p>
                </CardContent>
              </Card>

              <Link href="/purchase/list">
                <Card className="cursor-pointer hover:border-black">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Purchase</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      Rs {totalCurrentMonth.toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {percentageChangePurchase.toFixed(2)}% from last month
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <Link href="/invoice">
                <Card className="cursor-pointer hover:border-black">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      Rs {currentMonthSales.toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {percentageChange.toFixed(2)}% compared to previous period
                    </p>
                  </CardContent>
                </Card>
              </Link>

              <LOWSTOCK productResponse={productResponse} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Overview Sales</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview InvoiceData={InvoiceData} />
                </CardContent>
              </Card>

              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Overview Expense</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <ExpenseOverview expenses={expenses} />
                </CardContent>
              </Card>

              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Day-wise Overview Sales</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <MonthlyOverview InvoiceData={InvoiceData} />
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
                  <RecentSales InvoiceData={InvoiceData} />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <HorizontalBarChart invoices={InvoiceData} />
          </TabsContent>

          <TabsContent value="live-product-sale-check" className="space-y-4">
            <LiveTrackProduct invoices={InvoiceData} />
          </TabsContent>

          <TabsContent value="zikat" className="space-y-4 w-h-full">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Zakat Calculation (2.5%)</CardTitle>
                <CardDescription>
                  Estimated Zakat on unsold inventory stock and unpaid receivables.
                </CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <ZakatOverview data={zakatMetrics} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
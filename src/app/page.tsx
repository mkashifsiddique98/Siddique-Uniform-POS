import { Metadata } from "next";
<<<<<<< HEAD
=======
import { Button } from "@/components/ui/button";
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarDateRangePicker } from "@/components/dashboard/date-range-picker";
<<<<<<< HEAD
import { DownloadButton } from "@/components/dashboard/download-button";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
import { Overview } from "@/components/dashboard/overview";
import { RecentSales } from "@/components/dashboard/recent-sales";
import LOWSTOCK from "@/components/dashboard/low-stock";
import Link from "next/link";
import { Purchase } from "@/types/purchase";
import { Invoice } from "@/types/invoice";
import HorizontalBarChart from "@/components/dashboard/horizontal-bar-chart";
import { MonthlyOverview } from "@/components/dashboard/month-overview";
import ExpenseOverview from "@/components/dashboard/expense-overview";
import LiveTrackProduct from "@/components/dashboard/live-track-product";
<<<<<<< HEAD
import ZakatOverview from "@/components/dashboard/zakat-overview";
import { calculateZakat } from "@/lib/zikat";
import { serverFetch } from "@/lib/serverFetch";

interface DateRange {
  from?: Date;
  to?: Date;
}

async function fetchData(url: string) {
  try {
    const endpoint = url.replace(process.env.DOMAIN_NAME || "http://localhost:3000", "");
    const res = await serverFetch(endpoint, { cache: "no-store" });
=======

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

async function fetchData(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return null;
  }
}

async function getAllProductData() {
<<<<<<< HEAD
  return await fetchData("/api/product");
}

async function getAllInvoiceDetail() {
  return await fetchData("/api/invoice");
}

async function getAllPurchaseDetail() {
  const res = await fetchData("/api/purchase");
  return res?.response || [];
}

export async function getAllExpenseDetail() {
  try {
    const [utilizeRes, categoriesRes] = await Promise.all([
      serverFetch("/api/utilize"),
      serverFetch("/api/utilize/expense-categories"),
=======
  return await fetchData(`${DOMAIN_NAME}/api/product`);
}

async function getAllInvoiceDetail() {
  return await fetchData(`${DOMAIN_NAME}/api/invoice`);
}

async function getAllPurchaseDetail() {
  const res = await fetchData(`${DOMAIN_NAME}/api/purchase`);
  return res?.response || [];
}
export async function getAllExpenseDetail() {
  try {
    const [utilizeRes, categoriesRes] = await Promise.all([
      fetch(`${DOMAIN_NAME}/api/utilize`),
      fetch(`${DOMAIN_NAME}/api/utilize/expense-categories`),
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
    ]);

    if (!utilizeRes.ok || !categoriesRes.ok) {
      throw new Error("Failed to fetch utilize or categories");
    }

    const [utilizeData, categoryData] = await Promise.all([
      utilizeRes.json(),
      categoriesRes.json(),
    ]);

<<<<<<< HEAD
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

function calculateSalesForRange(invoices: Invoice[], dateRange?: DateRange) {
  const { from, to } = dateRange || {};

  const now = new Date();
  const startDate = from ?? new Date(now.getFullYear(), now.getMonth(), 1);
  const endDate = to ?? new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const currentPeriodInvoices = invoices.filter(({ invoiceDate }) => {
    const date = new Date(invoiceDate);
    return date >= startDate && date <= endDate;
  });

  const currentMonthSales = currentPeriodInvoices.reduce(
    (acc, { grandTotal }) => acc + grandTotal,
    0
  );

  const durationInMs = endDate.getTime() - startDate.getTime();
  const prevEndDate = new Date(startDate.getTime() - 1);
  const prevStartDate = new Date(prevEndDate.getTime() - durationInMs);

  const previousPeriodInvoices = invoices.filter(({ invoiceDate }) => {
    const date = new Date(invoiceDate);
    return date >= prevStartDate && date <= prevEndDate;
  });

  const previousMonthSales = previousPeriodInvoices.reduce(
    (acc, { grandTotal }) => acc + grandTotal,
    0
  );

  const percentageChange =
    previousMonthSales > 0
      ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100
      : 0;
=======
    // Create a category lookup map using _id
    const categoryMap = categoryData.reduce((acc, category) => {
      acc[category._id] = category.name;
      return acc;
    }, {} as Record<string, string>);

    // Replace category ID with actual name
    const updatedUtilize = utilizeData.map((item: any) => ({
      ...item,
      category: categoryMap[item.category] || "Unknown Category",
    }));
    
    return updatedUtilize;
  } catch (error) {
    console.error("Server Fetch Error:", error);
    return []; // return empty array on failure
  }
}

function calculateMonthSales(invoices: Invoice[], year: number, month: number) {
  const filteredInvoices = invoices.filter(({ invoiceDate }) => {
    const date = new Date(invoiceDate);
    return date.getFullYear() === year && date.getMonth() === month;
  });

  return filteredInvoices.reduce((acc, { grandTotal }) => acc + grandTotal, 0);
}

function calculateCurrentAndPreviousMonthSales(invoices: Invoice[]) {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const currentMonthSales = calculateMonthSales(invoices, currentYear, currentMonth);

  let previousYear = currentYear;
  let previousMonth = currentMonth - 1;
  if (previousMonth < 0) {
    previousMonth = 11;
    previousYear--;
  }

  const previousMonthSales = calculateMonthSales(invoices, previousYear, previousMonth);
  const percentageChange = previousMonthSales > 0
    ? ((currentMonthSales - previousMonthSales) / previousMonthSales) * 100
    : 0;
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

  return { currentMonthSales, previousMonthSales, percentageChange };
}

function calculateMonthlyPurchases(purchases: Purchase[]) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const calculateTotal = (month: number, year: number) =>
    purchases.reduce((total, purchase) => {
      const date = new Date(purchase.createdAt);
      if (date.getMonth() === month && date.getFullYear() === year) {
<<<<<<< HEAD
        return (
          total +
          purchase.products.reduce(
            (sum, product) => sum + product.productCost * (product.quantity || 1),
            0
          )
        );
=======
        return total + purchase.products.reduce((sum, product) => sum + (product.productCost * (product.quantity || 1)), 0);
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      }
      return total;
    }, 0);

  const totalCurrentMonth = calculateTotal(currentMonth, currentYear);
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const totalPreviousMonth = calculateTotal(previousMonth, previousYear);

<<<<<<< HEAD
  const percentageChangePurchase =
    totalPreviousMonth > 0
      ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100
      : 0;
=======
  const percentageChangePurchase = totalPreviousMonth > 0
    ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100
    : 0;
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

  return { totalCurrentMonth, totalPreviousMonth, percentageChangePurchase };
}

function calculateRevenuePercentageChange(invoices: Invoice[]) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const calculateTotalRevenue = (month: number, year: number) =>
    invoices.reduce((total, invoice) => {
      const date = new Date(invoice.invoiceDate);
      if (date.getMonth() === month && date.getFullYear() === year) {
<<<<<<< HEAD
        return (
          total +
          invoice.productDetail.reduce(
            (sum, product) => sum + product.sellPrice * product.quantity,
            0
          )
        );
=======
        return total + invoice.productDetail.reduce((sum, product) => sum + (product.sellPrice * product.quantity), 0);
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      }
      return total;
    }, 0);

  const totalCurrentMonthRevenue = calculateTotalRevenue(currentMonth, currentYear);
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const totalPreviousMonth = calculateTotalRevenue(previousMonth, previousYear);

<<<<<<< HEAD
  const percentageChangeRevenue =
    totalPreviousMonth > 0
      ? ((totalCurrentMonthRevenue - totalPreviousMonth) / totalPreviousMonth) * 100
      : 0;
=======
  const percentageChangeRevenue = totalPreviousMonth > 0
    ? ((totalCurrentMonthRevenue - totalPreviousMonth) / totalPreviousMonth) * 100
    : 0;
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

  return { totalCurrentMonthRevenue, totalPreviousMonth, percentageChangeRevenue };
}

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard app.",
};

<<<<<<< HEAD
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

  const { response: InvoiceData } = (await getAllInvoiceDetail()) || { response: [] };
  const { response: productResponse } = (await getAllProductData()) || { response: [] };
  const purchaseData = await getAllPurchaseDetail();
  const expenses = await getAllExpenseDetail();

  const { currentMonthSales, percentageChange } = calculateSalesForRange(
    InvoiceData,
    dateRange
  );
  const { totalCurrentMonth, percentageChangePurchase } =
    calculateMonthlyPurchases(purchaseData);
  const { totalCurrentMonthRevenue, percentageChangeRevenue } =
    calculateRevenuePercentageChange(InvoiceData);

  const zakatMetrics = calculateZakat(productResponse, InvoiceData, 0);
=======
export default async function DashboardPage() {
  const { response: InvoiceData } = await getAllInvoiceDetail() || { response: [] };
  const { response: productResponse } = await getAllProductData() || { response: [] };
  const { currentMonthSales, percentageChange } = calculateCurrentAndPreviousMonthSales(InvoiceData);
  const purchaseData = await getAllPurchaseDetail();
  const { totalCurrentMonth, percentageChangePurchase } = calculateMonthlyPurchases(purchaseData);
  const { totalCurrentMonthRevenue, percentageChangeRevenue } = calculateRevenuePercentageChange(InvoiceData);
  const expenses = await getAllExpenseDetail()
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

  return (
    <div className="hidden flex-col md:flex">
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <div className="flex items-center space-x-2">
            <CalendarDateRangePicker />
<<<<<<< HEAD
            <DownloadButton data={InvoiceData} filename="sales-invoices.csv" />
=======
            <Button>Download</Button>
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
          </div>
        </div>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
<<<<<<< HEAD
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
=======
            <TabsTrigger value="analytics">
              Analytics
            </TabsTrigger>
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
            <TabsTrigger value="live-product-sale-check">
              Live Product Sale Check
            </TabsTrigger>
<<<<<<< HEAD
            <TabsTrigger value="zikat">Zakat Calculation</TabsTrigger>
          </TabsList>

=======
          </TabsList>
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:border-black">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
<<<<<<< HEAD
                  <div className="text-2xl font-bold">
                    Rs {totalCurrentMonthRevenue.toFixed(0)}
                  </div>
=======
                  <div className="text-2xl font-bold">Rs {totalCurrentMonthRevenue.toFixed(0)}</div>
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
                  <p className="text-xs text-muted-foreground">
                    {percentageChangeRevenue.toFixed(2)}% from last month
                  </p>
                </CardContent>
              </Card>
<<<<<<< HEAD

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
              <Link href="/purchase/list">
                <Card className="cursor-pointer hover:border-black">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Purchase</CardTitle>
                  </CardHeader>
                  <CardContent>
<<<<<<< HEAD
                    <div className="text-2xl font-bold">
                      Rs {totalCurrentMonth.toFixed(0)}
                    </div>
=======
                    <div className="text-2xl font-bold">Rs {totalCurrentMonth.toFixed(0)}</div>
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
                    <p className="text-xs text-muted-foreground">
                      {percentageChangePurchase.toFixed(2)}% from last month
                    </p>
                  </CardContent>
                </Card>
              </Link>
<<<<<<< HEAD

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
              <Link href="/invoice">
                <Card className="cursor-pointer hover:border-black">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Sales</CardTitle>
                  </CardHeader>
                  <CardContent>
<<<<<<< HEAD
                    <div className="text-2xl font-bold">
                      Rs {currentMonthSales.toFixed(0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {percentageChange.toFixed(2)}% compared to previous period
=======
                    <div className="text-2xl font-bold">Rs {currentMonthSales.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground">
                      {percentageChange.toFixed(2)}% from last month
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
                    </p>
                  </CardContent>
                </Card>
              </Link>
<<<<<<< HEAD

              <LOWSTOCK productResponse={productResponse} />
            </div>

=======
              <LOWSTOCK productResponse={productResponse} />
            </div>
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Overview Sales</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <Overview InvoiceData={InvoiceData} />
                </CardContent>
              </Card>
<<<<<<< HEAD

=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
              <Card className="col-span-3">
                <CardHeader>
                  <CardTitle>Overview Expense</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <ExpenseOverview expenses={expenses} />
                </CardContent>
              </Card>
<<<<<<< HEAD

              <Card className="col-span-4">
=======
             
               <Card className="col-span-4">
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
                <CardHeader>
                  <CardTitle>Day-wise Overview Sales</CardTitle>
                </CardHeader>
                <CardContent className="pl-2">
                  <MonthlyOverview InvoiceData={InvoiceData} />
                </CardContent>
<<<<<<< HEAD
              </Card>

              <Card className="col-span-3">
=======
                </Card>
                 <Card className="col-span-3">
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
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
<<<<<<< HEAD
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
=======
                
            </div>
          </TabsContent>
          <TabsContent value="analytics" className="space-y-4">
            <HorizontalBarChart invoices={InvoiceData} />
          </TabsContent>
           <TabsContent value="live-product-sale-check" className="space-y-4">
            <LiveTrackProduct invoices={InvoiceData} />
          </TabsContent>
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        </Tabs>
      </div>
    </div>
  );
<<<<<<< HEAD
}
=======
}
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

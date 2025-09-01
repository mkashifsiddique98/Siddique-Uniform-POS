import { Metadata } from "next";
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
import LOWSTOCK from "@/components/dashboard/low-stock";
import Link from "next/link";
import { Purchase } from "@/types/purchase";
import { Invoice } from "@/types/invoice";
import HorizontalBarChart from "@/components/dashboard/horizontal-bar-chart";
import { MonthlyOverview } from "@/components/dashboard/month-overview";
import ExpenseOverview from "@/components/dashboard/expense-overview";

const DOMAIN_NAME = process.env.DOMAIN_NAME || "http://localhost:3000";

async function fetchData(url: string) {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return null;
  }
}

async function getAllProductData() {
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
    ]);

    if (!utilizeRes.ok || !categoriesRes.ok) {
      throw new Error("Failed to fetch utilize or categories");
    }

    const [utilizeData, categoryData] = await Promise.all([
      utilizeRes.json(),
      categoriesRes.json(),
    ]);

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

  return { currentMonthSales, previousMonthSales, percentageChange };
}

function calculateMonthlyPurchases(purchases: Purchase[]) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const calculateTotal = (month: number, year: number) =>
    purchases.reduce((total, purchase) => {
      const date = new Date(purchase.createdAt);
      if (date.getMonth() === month && date.getFullYear() === year) {
        return total + purchase.products.reduce((sum, product) => sum + (product.productCost * (product.quantity || 1)), 0);
      }
      return total;
    }, 0);

  const totalCurrentMonth = calculateTotal(currentMonth, currentYear);
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const totalPreviousMonth = calculateTotal(previousMonth, previousYear);

  const percentageChangePurchase = totalPreviousMonth > 0
    ? ((totalCurrentMonth - totalPreviousMonth) / totalPreviousMonth) * 100
    : 0;

  return { totalCurrentMonth, totalPreviousMonth, percentageChangePurchase };
}

function calculateRevenuePercentageChange(invoices: Invoice[]) {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const calculateTotalRevenue = (month: number, year: number) =>
    invoices.reduce((total, invoice) => {
      const date = new Date(invoice.invoiceDate);
      if (date.getMonth() === month && date.getFullYear() === year) {
        return total + invoice.productDetail.reduce((sum, product) => sum + (product.sellPrice * product.quantity), 0);
      }
      return total;
    }, 0);

  const totalCurrentMonthRevenue = calculateTotalRevenue(currentMonth, currentYear);
  const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  const totalPreviousMonth = calculateTotalRevenue(previousMonth, previousYear);

  const percentageChangeRevenue = totalPreviousMonth > 0
    ? ((totalCurrentMonthRevenue - totalPreviousMonth) / totalPreviousMonth) * 100
    : 0;

  return { totalCurrentMonthRevenue, totalPreviousMonth, percentageChangeRevenue };
}

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Dashboard app.",
};

export default async function DashboardPage() {
  const { response: InvoiceData } = await getAllInvoiceDetail() || { response: [] };
  const { response: productResponse } = await getAllProductData() || { response: [] };
  const { currentMonthSales, percentageChange } = calculateCurrentAndPreviousMonthSales(InvoiceData);
  const purchaseData = await getAllPurchaseDetail();
  const { totalCurrentMonth, percentageChangePurchase } = calculateMonthlyPurchases(purchaseData);
  const { totalCurrentMonthRevenue, percentageChangeRevenue } = calculateRevenuePercentageChange(InvoiceData);
  const expenses = await getAllExpenseDetail()

  return (
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
            <TabsTrigger value="analytics">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="reports" disabled>
              Reports
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="cursor-pointer hover:border-black">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">Rs {totalCurrentMonthRevenue.toFixed(0)}</div>
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
                    <div className="text-2xl font-bold">Rs {totalCurrentMonth.toFixed(0)}</div>
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
                    <div className="text-2xl font-bold">Rs {currentMonthSales.toFixed(0)}</div>
                    <p className="text-xs text-muted-foreground">
                      {percentageChange.toFixed(2)}% from last month
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
        </Tabs>
      </div>
    </div>
  );
}

import BreadCrum from "@/components/custom-components/bread-crum";
import AllProductTable from "./ProductTable";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Product",
};

const DOMAIN_NAME = process.env.DOMAIN_NAME;

async function getAllProductData() {
  try {
    const res = await fetch(`${DOMAIN_NAME}/api/product`,
      {next: { revalidate: 60 },}
  );
   if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error: any) {
    console.error("Failed to fetch data:", error.message);
    return null; // Return an empty array to handle missing data gracefully
  }
}

export default async function AllProduct({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const data = await getAllProductData();
  const response = data?.response || []; 

  const page = Number(searchParams["page"] ?? 1);
  const per_page = Number(searchParams["per_page"] ?? 5);
  const start = (page - 1) * per_page;
  const end = start + per_page;

  const entries = response.slice(start, end);
  const totalEntries = response.length;
  const totalPages = Math.ceil(totalEntries / per_page);

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Product" subfolder="List Product" />
      
        <AllProductTable
          AllProductData={entries}
          hasNextPage={end < response.length}
          hasPrevPage={start > 0}
          totalPages={totalPages}
        />
     
    </div>
  );
}

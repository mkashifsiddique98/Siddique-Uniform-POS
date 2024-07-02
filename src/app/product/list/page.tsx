import BreadCrum from "@/components/custom-components/bread-crum";
import AllProductTable from "./ProductTable";
import { Metadata } from "next";
export const metadata: Metadata = {
  title: "All Product",
};
async function getAllProductData() {
  const res = await fetch("http://localhost:3000/api/product/", {
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error("Failed to fetch data");
  }

  return res.json();
}
export default async function AllProduct({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const data = await getAllProductData();
  const { response } = data;
  const page = searchParams["page"] ?? 1;
  const per_page = searchParams["per_page"] ?? 5;
  const start = (Number(page) - 1) * Number(per_page);
  const end = start + Number(per_page);
  const entries = response.slice(start, end);
  const totalEntries = response.length;
  const totalPages = Math.ceil(totalEntries / Number(per_page));

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Product" subfolder="List Product" />
      {response && (
        <AllProductTable
          AllProductData={entries} 
          hasNextPage={end < response.length}
          hasPrevPage={start > 0}
          totalPages={totalPages}
        />
      )}
    </div>
  );
}

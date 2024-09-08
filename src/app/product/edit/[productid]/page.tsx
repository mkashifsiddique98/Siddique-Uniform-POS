// app/product/edit/[productid]/page.tsx
import BreadCrum from "@/components/custom-components/bread-crum";
import ProductFormClient from "./productFormClient";
import { sizeListTemplate } from "@/data";

const DOMAIN_NAME = process.env.DOMAIN_NAME;
// Server-side function to fetch product data by ID
async function getProductById(productId: string) {
  const response = await fetch(`${DOMAIN_NAME}/api/product/edit`, {
    method: "POST",
    body: JSON.stringify(productId),
    cache: "no-store",
  });
  if (!response.ok) return null;
  return await response.json();
}

// Server-side function to fetch school list
async function getSchoolList() {
  const response = await fetch(`${DOMAIN_NAME}/api/product/school-name`);
  if (!response.ok) return [];
  const data = await response.json();
  return data.response || [];
}

export default async function ProductEdit({
  params,
}: {
  params: { productid: string };
}) {
  const { productid } = params;

  // Fetch product and school data server-side
  const product = await getProductById(productid);
  const schoolList = await getSchoolList();

  return (
    <div className="container p-6">
      <BreadCrum mainfolder="Product" subfolder="Edit Product" />
      {/* Pass fetched data to client component */}
      <ProductFormClient
        productid={productid}
        product={product}
        schoolList={schoolList}
        sizeListTemplate={sizeListTemplate}
      />
    </div>
  );
}

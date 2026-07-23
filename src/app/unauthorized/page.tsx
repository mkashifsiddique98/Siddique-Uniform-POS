import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-6 bg-gray-50">
      <h1 className="text-6xl font-extrabold text-red-600 mb-4">403</h1>
      <h2 className="text-2xl font-semibold mb-2">Access Denied</h2>
      <p className="text-gray-700 mb-6 max-w-md text-center">
        Sorry, you do not have permission to view this page.
      </p>
     
      <Link href="/pos">
        <Button variant="default">Go to POS</Button>
      </Link>
      
    </main>
  );
}

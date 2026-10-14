export const handleGenerateNewInvoiceNumber = async (): Promise<number | void> => {
<<<<<<< HEAD
    // Read-only preview: this endpoint never increments the counter
    try {
      const res = await fetch("/api/invoice/create_unique_id", { cache: "no-store" });
=======
    try {
      const res = await fetch("/api/invoice/create_unique_id");
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
      const data = await res.json();
      if (data?.response) return Number(data.response);
    } catch (error) {
      console.error("Error generating new invoice number:", error);
    }
  };
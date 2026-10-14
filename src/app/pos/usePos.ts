export const handleGenerateNewInvoiceNumber = async (): Promise<number | void> => {
    // Read-only preview: this endpoint never increments the counter
    try {
      const res = await fetch("/api/invoice/create_unique_id", { cache: "no-store" });
      const data = await res.json();
      if (data?.response) return Number(data.response);
    } catch (error) {
      console.error("Error generating new invoice number:", error);
    }
  };
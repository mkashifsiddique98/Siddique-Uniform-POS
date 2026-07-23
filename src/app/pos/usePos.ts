export const handleGenerateNewInvoiceNumber = async (): Promise<number | void> => {
    try {
      const res = await fetch("/api/invoice/create_unique_id");
      const data = await res.json();
      if (data?.response) return Number(data.response);
    } catch (error) {
      console.error("Error generating new invoice number:", error);
    }
  };
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";

interface FormProps {
  onAdd: () => void;
  initialData?: any;
}
interface Category {
  _id: string;
  name: string;
}
export default function ExpenseForm({ onAdd, initialData }: FormProps) {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "",
    paymentMethod: "",
    handledBy: "",
    note: "",
  });
  const loadCategories = async () => {
    try {
      const res = await fetch("/api/utilize/expense-categories");
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);
  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title,
        amount: initialData.amount,
        category: typeof initialData.category === "object" ? initialData.category._id : initialData.category,
        paymentMethod: initialData.paymentMethod,
        handledBy: initialData.handledBy,
        note: initialData.note || "",
      });
    }
  }, [initialData]);

  const handleChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSelect = (name: string, value: string) => {
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async () => {
    try {
      if (initialData) {
        // UPDATE
        await fetch(`/api/utilize/`, {
          method: "PUT",
          body: JSON.stringify({id:initialData._id,data:{ ...form, amount: Number(form.amount)}}),
        });
          toast({
          title: "Expense Update",
          description: `${form.title} added successfully.`,
        });

      } else {
        // CREATE
        await fetch("/api/utilize", {
          method: "POST",
          body: JSON.stringify({ ...form, amount: Number(form.amount) }),
        });
       
      } toast({
          title: "Expense Added",
          description: `${form.title} added successfully.`,
        });

      onAdd();
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="grid gap-4">
      <Input
        name="title"
        value={form.title}
        placeholder="Title"
        onChange={handleChange}
      />
      <Input
        name="amount"
        value={form.amount}
        placeholder="Amount"
        type="number"
        onChange={handleChange}
      />
     <Select
  value={form.category}
  onValueChange={(val) => handleSelect("category", val)}
>
  <SelectTrigger>
    <SelectValue placeholder="Category" />
  </SelectTrigger>
  <SelectContent>
    {categories.map((expCat) => (
      <SelectItem value={expCat._id} key={expCat._id}>
        {expCat.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>

      <Select
        value={form.paymentMethod}
        onValueChange={(val) => handleSelect("paymentMethod", val)}
      >
        <SelectTrigger>
          <SelectValue placeholder="Payment Method" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Cash">Cash</SelectItem>
          <SelectItem value="Bank">Bank</SelectItem>
        </SelectContent>
      </Select>
      <Input
        name="handledBy"
        value={form.handledBy}
        placeholder="Handled By"
        onChange={handleChange}
      />
      <Textarea
        name="note"
        value={form.note}
        placeholder="Note"
        onChange={handleChange}
      />
      <Button onClick={handleSubmit}>
        {initialData ? "Update Expense" : "Add Expense"}
      </Button>
    </div>
  );
}

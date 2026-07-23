"use client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { customer } from "@/types/customer";
import { UserRoundPlus } from "lucide-react";
import { ChangeEvent, useState, useCallback, useEffect } from "react";

const customerTypes = [
  { value: "special-sitching", label: "Special-Sitching" },
  { value: "wholesale", label: "Wholesale" },
  { value: "walk-in-customer", label: "Walk-in-Customer" },
];

export default function CreateCustomerModel({
  handleGetAllCustomer,
}: {
  handleGetAllCustomer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [customerDetail, setCustomerDetail] = useState<customer>({
    customerName: "",
    schoolName: "",
    phone: 0,
    type: "",
  });
  const [errors, setErrors] = useState({
    customerName: "",
    phone: "",
    type: "",
  });
  const [isSubmitDisabled, setSubmitDisabled] = useState(true); // Track submit button state

  // Validation Logic
  const validateFields = () => {
    let valid = true;
    const newErrors = { customerName: "", phone: "", type: "" };

    if (!customerDetail.customerName) {
      newErrors.customerName = "Customer name is required.";
      valid = false;
    }

    // const phoneRegex = /^[0-9]{10,11}$/;
    // if (!phoneRegex.test(String(customerDetail.phone))) {
    //   newErrors.phone = "Phone number must be 10-11 digits.";
    //   valid = false;
    // }

    if (!customerDetail.type) {
      newErrors.type = "Customer type is required.";
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  // Enable/disable the submit button based on validation
  useEffect(() => {
    const isFormValid = validateFields();
    setSubmitDisabled(!isFormValid);
  }, [customerDetail]);

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setCustomerDetail({ ...customerDetail, [name]: value });
  };

  const handleCustomerDetailSubmit = useCallback(async () => {
    if (!validateFields()) {
      return;
    }

    try {
      const response = await fetch("/api/customer", {
        method: "POST",
        body: JSON.stringify(customerDetail),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      } else {
        // Reset form fields after submission
        setCustomerDetail({
          customerName: "",
          schoolName: "",
          phone: 0,
          type: "",
        });
        setOpen(false);
        handleGetAllCustomer(); // Refetch customer list
      }
    } catch (error: any) {
      console.error("Error submitting customer data:", error.message);
    }
  }, [customerDetail, handleGetAllCustomer]);
 
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UserRoundPlus className="w-5 h-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create Customer</DialogTitle>
          <DialogDescription>
            Only create customers when it&apos;s special or wholesale.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Name
            </Label>
            <Input
              id="name"
              name="customerName"
              placeholder="Ali from city"
              className="col-span-3"
              onChange={handleInputChange}
              value={customerDetail.customerName}
              aria-invalid={!!errors.customerName}
            />
            {errors.customerName && (
              <p className="text-red-600 col-span-4">{errors.customerName}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="phone" className="text-right">
              Phone
            </Label>
            <Input
              id="phone"
              name="phone"
              placeholder="03051234567"
              type="tel"
              className="col-span-3"
              onChange={handleInputChange}
              value={customerDetail.phone || ""}
              aria-invalid={!!errors.phone}
            />
            {errors.phone && (
              <p className="text-red-600 col-span-4">{errors.phone}</p>
            )}
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="schoolName" className="text-right">School</Label>
            <Input
              id="schoolName"
              name="schoolName"
              placeholder="School name (optional)"
              value={customerDetail.schoolName}
              onChange={handleInputChange}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">Type</Label>
            <select
              id="type"
              name="type"
              className="col-span-3 p-2 border rounded"
              value={customerDetail.type}
              onChange={handleInputChange}
              aria-invalid={!!errors.type}
            >
              <option value="">Select Type</option>
              {customerTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {errors.type && <p className="text-red-600 col-span-4">{errors.type}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="submit"
            onClick={handleCustomerDetailSubmit}
            disabled={isSubmitDisabled}
          >
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

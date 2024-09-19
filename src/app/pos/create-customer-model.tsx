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
import { ChangeEvent, useEffect, useState } from "react";

const customerType = [
  { value: "special-sitching", label: "Special-Sitching" },
  { value: "wholesale", label: "Wholesale" },
  { value: "walk-in-customer", label: "Walk-in-Customer" },
];
// *************************Only Create Customer is in the Page******************** 
// 
export default function CreateCustomerModel({
  handleGetAllCustomer,
}: {
  handleGetAllCustomer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [customerDetail, SetCustomerDetail] = useState<customer>({
    customerName: "",
    schoolName: "",
    phone: 0,
    type: "",
  });

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    SetCustomerDetail({ ...customerDetail, [name]: value });
  };

  const handleCustomerDetailSubmit = async () => {
    try {
      if (customerDetail) {
        const response = await fetch("/api/customer", {
          method: "POST",
          body: JSON.stringify(customerDetail),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        } else {
          SetCustomerDetail({
            customerName: "",
            schoolName: "",
            phone: 0,
            type: "",
          });
          setOpen(false);
          handleGetAllCustomer();
        }
      }
    } catch (error: any) {
      console.error("Error fetching customer data:", error.message);
    }
  };

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
            Only create customers when it&#39;s special or wholesale.
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
            />
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
              value={customerDetail.phone}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="school-name" className="text-right">
              School
            </Label>
            <Input
              id="school-name"
              name="schoolName"
              placeholder="school Name"
              className="col-span-3 p-2 border rounded"
              onChange={handleInputChange}
              value={customerDetail.schoolName}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer-type" className="text-right">
              Type
            </Label>
            <select
              id="customer-type"
              name="type"
              className="col-span-3 p-2 border rounded"
              onChange={handleInputChange}
              value={customerDetail.type}
            >
              <option value="">Select Type</option>
              {customerType.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" onClick={handleCustomerDetailSubmit}>
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

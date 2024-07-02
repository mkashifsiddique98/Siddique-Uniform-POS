"use client";
import AutoComplete from "@/components/custom-components/AutoComplete";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover } from "@/components/ui/popover";
import { customer } from "@/types/customer";
import { PopoverContent, PopoverTrigger } from "@radix-ui/react-popover";
import { UserRoundPlus } from "lucide-react";
import { ChangeEvent, ChangeEventHandler, useEffect, useState } from "react";
const frameworks = [
  {
    value: "gps",
    label: "Gujrat Public School",
  },
  {
    value: "danish school",
    label: "Danish School",
  },
  {
    value: "nuxt.js",
    label: "Nuxt.js",
  },
  {
    value: "remix",
    label: "Remix",
  },
  {
    value: "astro",
    label: "Astro",
  },
];
const customerType = [
  {
    value: "special-sitching",
    label: "Special-Sitching",
  },
  {
    value: "whole",
    label: "whole-Sale",
  },
  {
    value: "wake-in-customer",
    label: "wake-in-customer",
  },
];
export default function CreateCustomerModel({
  handleGetAllCustomer,
}: {
  handleGetAllCustomer: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [customerDetail, SetCustomerDetail] = useState<customer>({customerName: "",schoolName:"",_id:""});

  const HandleSchoolNameChange = (value: string) => {
    SetCustomerDetail({ ...customerDetail, schoolName: value });
  };
  const HandleCustomerType = (value: string) => {
    SetCustomerDetail({ ...customerDetail, type: value });
  };
  const handelCreateNewCusomter = (event: ChangeEvent<HTMLInputElement>) => {
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
          SetCustomerDetail({customerName: "",schoolName:"",_id:""}); // clear up
          setOpen(false);
          handleGetAllCustomer();
        }
      }
    } catch (error: any) {
      console.error("Error fetching Cusomter data:", error.message);
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
            Only Create Customer When its Special or any thing remaining or
            whole Sale Customer
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
              placeholder="ali from city"
              className="col-span-3"
              onChange={handelCreateNewCusomter}
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
              onChange={handelCreateNewCusomter}
              value={customerDetail.phone}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label
              htmlFor="school-name"
              className="text-right whitespace-nowrap"
            >
              School Name
            </Label>
            <AutoComplete
              label="School Name"
              arrayList={frameworks}
              selectvalueFn={HandleSchoolNameChange}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer-type" className="text-right">
              Type
            </Label>
            <AutoComplete
              label="Customer Type"
              arrayList={customerType}
              selectvalueFn={HandleCustomerType}
            />
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

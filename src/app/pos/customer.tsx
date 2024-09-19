"use client";
import * as React from "react";
import CreateCustomerModel from "./create-customer-model";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { customer } from "@/types/customer";
import { Skeleton } from "@/components/ui/skeleton";

const defaultCustomerName = "wake-in-customer"; // Default customer details

interface AutoComplete {
  label: string;
  customerList: customer[];
  setCustomerList: (customers: customer[]) => void; // Set customer list after creation
  selectvalueFn: (value: string) => void;
}

const CusomterAutoComplete: React.FC<AutoComplete> = ({
  customerList,
  setCustomerList,
  label,
  selectvalueFn,
}) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | null>(null); // Track selected value
  const [loading, setLoading] = React.useState(true); // Track loading state

  // Check if "wake-in-customer" exists in the customer list
  const defaultCustomerDetails = customerList.find(
    (customer) => customer.customerName === defaultCustomerName
  );

  // If "wake-in-customer" doesn't exist, create it and refetch the list
  const createDefaultCustomer = async () => {
    if (!defaultCustomerDetails) {
      const newCustomer = {
        customerName: defaultCustomerName,
        schoolName: "any",
        phone: 0,
        type: "wake-in-customer",
      };

      try {
        const response = await fetch("/api/customer", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(newCustomer),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        // Fetch the updated customer list after creation
        const updatedList = await fetch("/api/customer", {
          method: "GET",
        });
        const customers = await updatedList.json();
        setCustomerList(customers); // Update customer list

        // Automatically select the default customer after creation
        const createdCustomer = customers.find(
          (customer: customer) =>
            customer.customerName === defaultCustomerName
        );
        if (createdCustomer) {
          setValue(createdCustomer.customerName); // Set value for default customer
          selectvalueFn(createdCustomer.customerName); // Update parent component
        }
      } catch (error) {
        console.error("Error creating default customer:", error.message);
      }
    } else {
      setValue(defaultCustomerDetails.customerName); // Set value for default customer if it already exists
      selectvalueFn(defaultCustomerDetails.customerName); // Update parent component
    }
    setLoading(false);
  };

  // Create "wake-in-customer" if not found when the component mounts
  React.useEffect(() => {
    createDefaultCustomer();
  }, []); // Only run once on mount

  if (loading) {
    return <div>
      <Skeleton className="h-10 w-auto" />
    </div>; // Render a loading state while creating/fetching customer
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-auto lg:w-[560px] justify-between`}
        >
          {value
            ? customerList?.find((customer) => customer.customerName === value)
                ?.customerName
            : `Select ${label}...`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-auto lg:w-[560px] p-0`}>
        <Command>
          <CommandInput placeholder={`${label}...`} />
          <CommandEmpty>No {label} found.</CommandEmpty>
          <CommandGroup>
            {customerList.map((customer) => (
              <CommandItem
                key={customer.customerName}
                value={customer.customerName}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue);
                  selectvalueFn(currentValue); // Update the value properly
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === customer.customerName
                      ? "opacity-100"
                      : "opacity-0"
                  )}
                />
                {customer.customerName}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default function Customer({
  customerDetailList,
  handleChangeValue,
  handleGetAllCustomer,
  setCustomerList,
}: {
  customerDetailList: customer[];
  handleGetAllCustomer: () => void;
  handleChangeValue: (value: string | undefined) => void;
  setCustomerList?: (customers: customer[]) => void;
}) {
  return (
    <div className="flex justify-between w-full">
      <CusomterAutoComplete
        customerList={customerDetailList}
        setCustomerList={setCustomerList}
        label="Customer"
        selectvalueFn={handleChangeValue}
      />
      <CreateCustomerModel handleGetAllCustomer={handleGetAllCustomer} />
    </div>
  );
}

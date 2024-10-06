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

const defaultCustomerName = "wake-in-customer";

interface AutoCompleteProps {
  label: string;
  customerList: customer[];
  setCustomerList: (customers: customer[]) => void | undefined;
  selectvalueFn: (value: string) => void;
}

const CusomterAutoComplete: React.FC<AutoCompleteProps> = ({
  customerList,
  setCustomerList,
  label,
  selectvalueFn,
}) => {
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const defaultCustomer = customerList.find(
    (customer) => customer.customerName === defaultCustomerName
  );

  const createDefaultCustomer = async () => {
    try {
      if (!defaultCustomer) {
        const newCustomer = {
          customerName: defaultCustomerName,
          schoolName: "any",
          phone: 0,
          type: "wake-in-customer",
        };

        const response = await fetch("/api/customer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newCustomer),
        });

        if (!response.ok) {
          throw new Error(`Failed to create customer: ${response.status}`);
        }

        const updatedList = await fetch("/api/customer");
        const customers = await updatedList.json();
        setCustomerList(customers);

        const createdCustomer = customers.find(
          (customer: customer) =>
            customer.customerName === defaultCustomerName
        );
        if (createdCustomer) {
          setValue(createdCustomer.customerName);
          selectvalueFn(createdCustomer.customerName);
        }
      } else {
        setValue(defaultCustomer.customerName);
        selectvalueFn(defaultCustomer.customerName);
      }
    } catch (error) {
      console.error("Error creating default customer:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    createDefaultCustomer();
  }, []);

  if (loading) {
    return (
      <div>
        <Skeleton className="h-10 w-auto" />
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-auto lg:w-[560px] justify-between"
        >
          {value
            ? customerList.find((customer) => customer.customerName.toLowerCase() === value.toLowerCase())
                ?.customerName
            : `Select ${label}...`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto lg:w-[560px] p-0">
        <Command>
          <CommandInput placeholder={`Search ${label}...`} />
          <CommandEmpty>No {label} found.</CommandEmpty>
          <CommandGroup>
            {customerList.map((customer) => (
              <CommandItem
                key={customer.customerName}
                value={customer.customerName}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue);
                  selectvalueFn(currentValue);
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
                {customer.customerName}&nbsp;&nbsp;&nbsp;({customer.type})
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
    <div className="flex justify-between items-center w-[80%] gap-2">
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
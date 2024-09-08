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

const frameworks = [
  {
    value: "wake-in-customer",
    label: "wake-in-customer",
  },
];

interface AutoComplete {
  label: string;
  customerList: customer[];
  selectvalueFn: (value: string) => void;
  
}
const CusomterAutoComplete: React.FC<AutoComplete> = ({
  customerList,
  label,
  selectvalueFn,

}) => {
 
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState("");

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
            {customerList.map((customer, index) => (
              <CommandItem
                key={customer.customerName}
                value={customer.customerName}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue);
                  selectvalueFn(value);
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
}: {
  customerDetailList: customer[];
  handleGetAllCustomer: () => void;
  handleChangeValue:(value: string | undefined)=>void
}) {
  return (
    <div className="flex justify-between w-full">
      <CusomterAutoComplete
        customerList={customerDetailList}
        label="Customer"
        selectvalueFn={handleChangeValue}
      />
      <CreateCustomerModel handleGetAllCustomer={handleGetAllCustomer} />
    </div>
  );
}

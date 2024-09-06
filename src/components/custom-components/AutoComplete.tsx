"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface ArrayListOption {
  value: string;
  label: string;
}
interface AutoComplete {
  label: string;
  arrayList: ArrayListOption[];
  selectvalueFn: (value: string) => void;
  defaultValue?: string;
  width?: string ;
}
const AutoComplete: React.FC<AutoComplete> = ({
  arrayList,
  label,
  selectvalueFn,
  defaultValue,width
}) => {
  const defaultValueTem = defaultValue ? defaultValue :""
  const [open, setOpen] = React.useState(false);
  const [value, setValue] = React.useState(defaultValueTem);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={`w-[280px] justify-between ${width ? width :""}`}
        >
          {value
            ? arrayList.find((framework) => framework.value === value)?.label
            : `Select ${label}...`}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className={`w-[280px] p-0 ${width ? width : ""}`}>
        <Command>
          <CommandInput placeholder={`${label}...`} />
          <CommandEmpty>No {label} found.</CommandEmpty>
          <CommandGroup>
            {arrayList.map((framework) => (
              <CommandItem
                key={framework.label}
                value={framework.value}
                onSelect={(currentValue) => {
                  setValue(currentValue === value ? "" : currentValue);
                  selectvalueFn(currentValue);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === framework.value ? "opacity-100" : "opacity-0"
                  )}
                />
                {framework.label}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
export default AutoComplete;

import { CalendarIcon } from "@radix-ui/react-icons";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import { FormField, FormItem, FormLabel } from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "../ui/button";
import { Label } from "../ui/label";

export default function CalendarForm({
  date,
  handleDateChange,
}: {
  date: Date;
  handleDateChange: (newDate: Date) => void;
}) {
  return (
    <form className="space-y-8">
      <div className="flex flex-col">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-[240px] pl-3 text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              {date ? format(date, "PPP") : <span>Pick a date</span>}
              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="center" >
            <Calendar
            
              mode="single"
              selected={date}
              disabled={(date) =>
                 date < new Date()
              }
              onSelect={(selectedDate) => {
                if (selectedDate != undefined) {
                  handleDateChange(selectedDate);
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </form>
  );
}

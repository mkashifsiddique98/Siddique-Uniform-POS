import React, { useMemo } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { ProductFormState } from "@/types/product";
import { formSchema } from "@/validation/product";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils"; // make sure this exists or define below
import MultiImageDropzone from "./ImageDropzone";

interface SizeListTemplateProps {
  name: string;
  size: string[];
}

interface School {
  location: string;
  name: string;
  _id?: string;
}

interface IProduct {
  _id: string;
  productName: string;
  size: string;
}

interface ProductFormProps {
  form: ReturnType<typeof useForm<ProductFormState>>;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  mode: string;
  schoolList: School[];
  sizeListTemplate: SizeListTemplateProps[];
  productList: IProduct[]; // for bundle components
}

const ProductForm: React.FC<ProductFormProps> = ({
  form,
  onSubmit,
  schoolList,
  sizeListTemplate,
  mode,
  productList,
}) => {
  const category = useWatch({ control: form.control, name: "category" });
  const isBundle = useWatch({ control: form.control, name: "isBundle" });
  const images = useWatch({ control: form.control, name: "images" }) || [];
 

  const setImages = (newImages: string[] | ((prev: string[]) => string[])) => {
    if (typeof newImages === "function") {
      // if passed a callback
      form.setValue("images", newImages(images));
    } else {
      form.setValue("images", newImages);
    }
  };

  const sizeList = useMemo(() => {
    const selectedData = sizeListTemplate.find(
      (item) => item.name.toLowerCase() === category?.toLowerCase()
    );
    return selectedData?.size || [];
  }, [category, sizeListTemplate]);

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex flex-col gap-4"
      >
        {/* Product Name & School Name */}
        <div className="flex gap-4">
          <FormField
            control={form.control}
            name="productName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>Product</FormLabel>
                <FormControl>
                  <Input placeholder="Product Name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="schoolName"
            render={({ field }) => (
              <FormItem className="w-full">
                <FormLabel>School Name</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a School Name" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {schoolList.map((school, index) => (
                      <SelectItem value={school.name} key={index}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Category, Size, Stock Alert */}
        <div className="flex w-full justify-between gap-4">
          <div className="w-1/3">
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Category</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="flex flex-wrap space-x-2"
                    >
                      {sizeListTemplate.map((item, index) => (
                        <FormItem
                          key={index}
                          className="flex items-center space-x-3 space-y-0"
                        >
                          <FormControl>
                            <RadioGroupItem value={item.name} />
                          </FormControl>
                          <FormLabel className="font-normal">
                            {item.name}
                          </FormLabel>
                        </FormItem>
                      ))}
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="w-1/3">
            <FormField
              control={form.control}
              name="size"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Size</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Size" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {sizeList.map((size, index) => (
                        <SelectItem value={size} key={index}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="w-1/3">
            <FormField
              control={form.control}
              name="stockAlert"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Stock Alert</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Stock Alert" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Cost Fields */}
        <div className="flex w-full justify-between gap-4">
          {["productCost", "wholesalePrice", "sellPrice"].map(
            (fieldName, index) => (
              <div key={index} className="w-1/3">
                <FormField
                  control={form.control}
                  name={fieldName as keyof ProductFormState}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {fieldName.replace(/([A-Z])/g, " $1")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder={fieldName}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )
          )}
        </div>

        {/* Is Bundle */}
        <FormField
          control={form.control}
          name="isBundle"
          render={({ field }) => (
            <FormItem className="flex items-center gap-3 space-y-0">
              <FormControl>
                <input
                  id="isBundle"
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="w-5 h-5
                 accent-black border border-gray-300 rounded cursor-pointer transition-all duration-150"
                />
              </FormControl>
              <FormLabel htmlFor="isBundle" className="cursor-pointer">
                Is Bundle(have two piece)?
              </FormLabel>
            </FormItem>
          )}
        />

        {/* Bundle Product Selection */}
        {isBundle && (
          <FormField
            control={form.control}
            name="components"
            render={({ field }) => (
              <FormItem className="flex flex-col gap-2">
                <FormLabel>Select Components (Qameez, Shalwar, etc.)</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {field.value?.length
                        ? `Selected (${field.value.length})`
                        : "Select components"}
                      <span className="ml-2">▼</span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search product..." />
                      <CommandEmpty>No product found.</CommandEmpty>
                      <CommandList>
                        {productList.map((product) => {
                          const selected = field.value?.includes(product._id);
                          return (
                            <CommandItem
                              key={product._id}
                              onSelect={() => {
                                const current = field.value || [];
                                const updated = selected
                                  ? current.filter((id) => id !== product._id)
                                  : [...current, product._id];
                                field.onChange(updated);
                              }}
                              className="cursor-pointer"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selected ? "opacity-100" : "opacity-0"
                                )}
                              />
                              {product.productName} ({product.size})
                            </CommandItem>
                          );
                        })}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {field.value?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {field?.value.map((id) => {
                      const prod = productList.find((p) => p._id === id);
                      if (!prod) return null;
                      return (
                        <div
                          key={id}
                          className="flex items-center gap-1 bg-muted text-muted-foreground px-2 py-1 rounded-full text-sm border hover:shadow"
                        >
                          <span>{prod.productName}</span>
                          <button
                            type="button"
                            className="ml-1 text-red-500 hover:text-red-700"
                            onClick={() => {
                              const updated = field?.value.filter(
                                (itemId) => itemId !== id
                              );
                              field.onChange(updated);
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <MultiImageDropzone images={images} setImages={setImages} />
        <Button type="submit" className="mt-4">
          {mode}
        </Button>
      </form>
    </Form>
  );
};

export default ProductForm;

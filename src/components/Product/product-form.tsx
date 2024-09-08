import React, { useState, useEffect, useMemo } from "react";
import { useForm, SubmitHandler, useWatch } from "react-hook-form";
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

interface SizeListTemplateProps {
  name: string;
  size: string[];
}

interface School {
  location: string;
  name: string;
  _id?: string;
}

interface ProductFormProps {
  form: ReturnType<typeof useForm<ProductFormState>>;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  mode: string;
  schoolList: School[];
  sizeListTemplate: SizeListTemplateProps[];
}

const ProductForm: React.FC<ProductFormProps> = ({
  form,
  onSubmit,
  schoolList,
  sizeListTemplate,
  mode,
}) => {
  const category = useWatch({ control: form.control, name: "category" });

  // Use useMemo to derive sizeList based on category change
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
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue>
                        {field.value || "Select a School Name"}
                      </SelectValue>
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
                      
                      className="flex flex-wrap space-x-1"
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
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue>
                          {field.value || "Select a Size for Product"}
                        </SelectValue>
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
                    <Input placeholder="Stock Alert" {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <div className="flex w-full justify-between gap-4">
          <div className="w-1/3">
            <FormField
              control={form.control}
              name="productCost"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Cost</FormLabel>
                  <FormControl>
                    <Input placeholder="Product Cost" type="number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="w-1/3">
            <FormField
              control={form.control}
              name="wholesalePrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Wholesale Price</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Wholesale Price"
                      {...field}
                      type="number"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div className="w-1/3">
            <FormField
              control={form.control}
              name="sellPrice"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sell Price</FormLabel>
                  <FormControl>
                    <Input placeholder="Sell Price" {...field} type="number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit">{mode}</Button>
      </form>
    </Form>
  );
};

export default ProductForm;

import React, { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
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
interface sizeListTemplateProps {
  name: string;
  size: string[];
}
interface schoolList {
  location:string;
  name:string;
  _id?: string
}
interface ProductFormProps {
  form: ReturnType<typeof useForm<ProductFormState>>;
  onSubmit: (values: z.infer<typeof formSchema>) => Promise<void>;
  mode: string;
  schoolList: schoolList[];
  sizeListTemplate: sizeListTemplateProps[];
}
const ProductForm: React.FC<ProductFormProps> = ({
  form,
  onSubmit,
  schoolList,
  sizeListTemplate,
  mode,
}) => {
  const [sizeList, setSizeList] = useState<string[]>([]);
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
                  defaultValue={field.value}
                >
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
                      onValueChange={(value) => {
                        field.onChange(value);
                        const selectedData = sizeListTemplate.find(
                          (item) =>
                            item.name.toLowerCase() === value.toLowerCase()
                        );
                        setSizeList(selectedData?.size || []);
                      }}
                      defaultValue={field.value}
                      className="flex flex-wrap  space-x-1"
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
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a Size for Product" />
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
                    <Input placeholder="stock Alert" {...field} type="number" />
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
                    <Input placeholder="productCost" type="number" {...field} />
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
                      placeholder="wholesale Price"
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
                    <Input placeholder="sell Price" {...field} type="number" />
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

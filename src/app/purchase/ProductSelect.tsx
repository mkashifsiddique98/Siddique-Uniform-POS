import { ProductFormState } from "@/types/product";
import React, { FC, useState } from "react";
import Select from "react-select";

export const customStyles = {
  control: (provided: any, state: any) => ({
    ...provided,
    borderColor: state.isFocused ? '#3f3f46' : '#e5e7eb', // Dark gray when focused, light gray otherwise
    boxShadow: state.isFocused ? '0 0 0 1px #3f3f46' : 'none', // Subtle shadow when focused
    '&:hover': {
      borderColor: '#3f3f46', // Dark gray border on hover
    },
    borderRadius: '6px', // Rounded corners consistent with Shadcn UI
    padding: '4px', // Padding around the input
  }),
  menu: (provided: any) => ({
    ...provided,
    borderRadius: '6px', // Rounded corners for the dropdown menu
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Light shadow for the dropdown menu
    backgroundColor: '#ffffff', // White background for the dropdown
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected ? '#3f3f46' : state.isFocused ? '#f4f4f5' : '#ffffff', // Dark gray for selected, light gray on hover
    color: state.isSelected ? '#ffffff' : '#000000', // White text if selected, black otherwise
    '&:active': {
      backgroundColor: '#3f3f46', // Dark gray background when option is active
      color: '#ffffff',
    },
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: '#3f3f46', // Text color for the selected value, dark gray
  }),
  valueContainer: (provided: any) => ({
    ...provided,
    minHeight: '40px', // Adjust the height
    fontSize: '16px', // Adjust the font size
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: '#a1a1aa', // Placeholder color, lighter gray
  }),
};

interface ProductSelectProps {
  products: ProductFormState[];
  handleSelectProduct: (selectedOption: any) => void;
}

const ProductSelect: FC<ProductSelectProps> = ({ handleSelectProduct, products }) => {
  const [selectedOption, setSelectedOption] = useState(null);

  const productOptions = products?.map((product) => ({
    value: product._id,  // Using _id to match the product
    label: product.productName,
  })) || [];

  const handleChange = (option: any) => {
    setSelectedOption(option);
    handleSelectProduct(option);
    setSelectedOption(null); // Clear selection after adding product
  };


  return (

    <Select
      styles={customStyles}
      value={selectedOption}
      options={productOptions}
      onChange={handleChange}
      placeholder="Search and Select a product..."
      isLoading={!products.length}
    />

  );
};

export default ProductSelect;

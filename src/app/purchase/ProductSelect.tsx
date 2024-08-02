import { ProductFormState } from "@/types/product";
import React, { FC, useState } from "react";
import Select from "react-select";

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
    console.log("Selected Option in Select:", option);
    setSelectedOption(option);
    handleSelectProduct(option);
    setSelectedOption(null); // Clear selection after adding product
  };
  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      borderColor: state.isFocused ? '#4a90e2' : '#d0d0d0', // Blue when focused, light grey otherwise
      boxShadow: state.isFocused ? '0 0 0 1px #4a90e2' : 'none', // Subtle shadow when focused
      '&:hover': {
        borderColor: '#4a90e2', // Blue border on hover
      },
      borderRadius: '4px',  // Rounded corners
      padding: '4px',       // Padding around the input
    }),
    menu: (provided: any) => ({
      ...provided,
      borderRadius: '4px',  // Rounded corners for the dropdown menu
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)', // Light shadow for the dropdown menu
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? '#4a90e2' : state.isFocused ? '#f0f0f0' : '#ffffff',
      color: state.isSelected ? '#ffffff' : '#000000',
      '&:active': {
        backgroundColor: '#4a90e2', // Blue background when option is active
        color: '#ffffff',
      },
    }),
    singleValue: (provided: any) => ({
      ...provided,
      color: '#000000', // Text color for the selected value
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      minHeight: '50px',  // Adjust the height
      fontSize: '16px',   // Adjust the font size
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#a0a0a0', // Placeholder color
    }),
  };
  return (
    <div className="m-4">
      <Select 
        styles={customStyles}
        value={selectedOption}
        options={productOptions}
        onChange={handleChange}
        placeholder="Search and select a product..."
        isLoading={!products.length}
      />
    </div>
  );
};

export default ProductSelect;

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { X, XCircle } from "lucide-react";
import React, { FC, useState } from "react";
import { schoolList, sizeListTemplate } from "@/data";
import { FilterElementProps } from "@/types/product";

const FilterSchoolCom = ({
  toggleSidebarSchool,
  handleClearFilter,
  handleFilterChangeElement,
  filterElement,
}: {
  toggleSidebarSchool: () => void;
  handleClearFilter: () => void;
  handleFilterChangeElement: (filterElement: FilterElementProps) => void;
  filterElement: FilterElementProps;
}) => {
  return (
    <>
      <div className="fixed top-0 right-0 h-full w-72 bg-white  p-4 transition-transform transform translate-x-0 z-50 shadow-2xl">
        {/* Sidebar content goes here */}
        <button
          onClick={toggleSidebarSchool}
          className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
        >
          <XCircle className="w-6 h-6" />
        </button>
        <div>
          <p className="leading-1 font-bold text-xl">Filter School</p>
          <div className="grid grid-cols-1 gap-1 mt-5">
            {schoolList.map((school, index) => (
              <Card
                key={school + index}
                className={`p-4 w-full h-14 border hover:border-black cursor-pointer capitalize flex items-center justify-center"  ${
                  school == filterElement.filterValue ? "border-black" : ""
                }`}
                onClick={() => {
                  const filterElementTem = {
                    filterBy: "schoolName",
                    filterValue: school,
                  };
                  // Need to Work Here
                  // handleFilterChangeElement(filterElementTem);
                }}
              >
                <p className="leading-6 text-lg ">{school}</p>
              </Card>
            ))}
          </div>
          <div className="mt-4 flex justify-center items-center">
            <Button variant="outline" onClick={handleClearFilter}>
              {" "}
              <X className="mr-2" />
              Clear filter
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};
interface FilterBtnProductProps {
  handleFilterChangeElement: (filterElement: FilterElementProps) => void;
  filterElement: FilterElementProps;
}
const FilterBtnProduct: FC<FilterBtnProductProps> = ({
  filterElement,
  handleFilterChangeElement,
}) => {
  const [isSidebarVisible, setSidebarVisible] = useState(false);
  const [isSidebarVisibleSchool, setSidebarVisibleSchool] = useState(false);

  const toggleSidebar = () => {
    setSidebarVisible(!isSidebarVisible);
  };
  const toggleSidebarSchool = () => {
    setSidebarVisibleSchool(!isSidebarVisibleSchool);
  };
  const handleClearFilter = () => {
    const filterElementTem = {
      filterBy: "",
      filterValue: "",
    };
    handleFilterChangeElement(filterElementTem);
  };
  return (
    <div className="flex justify-between m-2">
      <Button onClick={toggleSidebar} className="relative ">
        Filter Category
        {filterElement.filterValue !="" && (
          <span className="absolute font-semibold p-1 text-[10px] -top-3 -right-2 rounded-md bg-green-400">
            {filterElement.filterValue}
          </span>
        )}
      </Button>
      <Button onClick={toggleSidebarSchool}>Filter School</Button>
      <Button variant="outline" onClick={handleClearFilter}>
        {" "}
        <X className="mr-2" />
        Clear filter
      </Button>
      <Button>Advance Filter</Button>
      {isSidebarVisible && (
        <div className="fixed top-0 right-0 h-full w-72 bg-white  p-4 transition-transform transform translate-x-0 z-40 shadow-2xl">
          {/* Sidebar content goes here */}
          <button
            onClick={toggleSidebar}
            className="absolute top-2 right-2 text-gray-600 hover:text-gray-800"
          >
            <XCircle className="w-6 h-6" />
          </button>
          <div>
            <p className="leading-1 font-bold text-xl">Filter Category</p>
            <div className="grid grid-cols-3 gap-1 mt-5">
              {sizeListTemplate.map((category, index) => (
                <Card
                  key={category.name + index}
                  className={`p-4 w-20 h-20 border hover:border-black cursor-pointer capitalize flex items-center justify-center ${
                    category.name == filterElement.filterValue
                      ? "border-black"
                      : ""
                  } `}
                  onClick={() => {
                    const filterElementTem = {
                      filterBy: "category",
                      filterValue: category.name,
                    };
                    handleFilterChangeElement(filterElementTem);
                  }}
                >
                  <p className="leading-6 text-lg ">{category.name}</p>
                </Card>
              ))}
            </div>
            <div className="mt-4 flex justify-center items-center">
              <Button variant="outline" onClick={handleClearFilter}>
                {" "}
                <X className="mr-2" />
                Clear filter
              </Button>
            </div>
          </div>
        </div>
      )}
      {isSidebarVisibleSchool && (
        <FilterSchoolCom
          toggleSidebarSchool={toggleSidebarSchool}
          handleClearFilter={handleClearFilter}
          handleFilterChangeElement={handleFilterChangeElement}
          filterElement={filterElement}
        />
      )}
    </div>
  );
};

export default FilterBtnProduct;

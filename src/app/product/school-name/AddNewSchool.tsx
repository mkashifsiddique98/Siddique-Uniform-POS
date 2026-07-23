"use client";

import { School } from "@/types/school-name";
import React, { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import clsx from "clsx";
import { toast } from "@/components/ui/use-toast";
interface school {
  _id?: string;
  name: string;
  location: string;
}
interface AddNewSchoolProps {
  SchoolList: school[];
}
const AddNewSchool: FC<AddNewSchoolProps> = ({ SchoolList }) => {
  const [schools, setSchools] = useState<School[]>(
    SchoolList ? SchoolList : []
  );
  // State for managing form inputs
  const [schoolName, setSchoolName] = useState("");
  const [schoolLocation, setSchoolLocation] = useState("");
  // State for managing edit mode
  const [editMode, setEditMode] = useState(false);
  // State for managing currently editing school ID
  const [editSchoolId, setEditSchoolId] = useState("");

  // Function to handle adding a new school
  const addSchool = async () => {
    if (schoolName && schoolLocation) {
      // Creating a new school object
      const newSchool: School = {
        name: schoolName,
        location: schoolLocation,
      };
      // Adding the new school to the schools array
      setSchools([...schools, newSchool]);
      const response = await fetch("/api/product/school-name", {
        method: "POST",
        body: JSON.stringify(newSchool),
      });

      if (response.ok) {
        // Clearing the input fields
        setSchoolName("");
        setSchoolLocation("");
        toast({
          description: "Add New School Successfully!",
          variant: "default",
        });
      }
    } else {
      toast({
        description: "Please enter both school name and location.",
      });
    }
  };

  // Function to handle editing or updating a school
  const handleEditOrUpdate = async (id: string | undefined) => {
    if (editMode) {
      // Update mode - update the school
      const updatedSchools = schools.map((school) => {
        if (school._id === id) {
          return {
            ...school,
            name: schoolName,
            location: schoolLocation,
          };
        }
        return school;
      });
      setSchools(updatedSchools);
      const updateSchoolDetail = {
        _id: id,
        name: schoolName,
        location: schoolLocation,
      };
      try {
        const response = await fetch("/api/product/school-name", {
          method: "PUT",
          body: JSON.stringify(updateSchoolDetail),
        });
        if (response.ok) {
          // Reset form inputs and edit mode
          setSchoolName("");
          setSchoolLocation("");
          setEditMode(false);
          setEditSchoolId("");
          toast({
            description: "Update Successfully School Name",
            variant: "default",
          });
        }
      } catch (error) {
        console.log(error);
      }
    } else {
      // Edit mode - populate form inputs with school data
      const schoolToEdit = schools.find((school) => school._id === id);
      if (schoolToEdit) {
        setSchoolName(schoolToEdit.name);
        setSchoolLocation(schoolToEdit.location);
        setEditMode(true);
        setEditSchoolId(id);
      }
    }
  };

  // Function to handle deleting a school
  const deleteSchool = async (id: string | undefined) => {
    const updatedSchools = schools.filter((school) => school._id !== id);
    setSchools(updatedSchools);
    try {
      const response = await fetch("/api/product/school-name", {
        method: "DELETE",
        body: JSON.stringify({ _id: id }),
      });
      if (response.ok) {
        // Reset form inputs and edit mode
        toast({
          description: "Delete School Name!",
        });
      }
    } catch (error) {
      console.log(error);
    }
  };
  return (
    <div>
      {" "}
      {/* Form to add or update a school */}
      <div className="mb-4 flex w-full justify-between">
        <Input
          type="text"
          className="w-full border border-gray-300 rounded px-3 py-2 mr-2"
          placeholder="Enter school name"
          value={schoolName}
          onChange={(e) => setSchoolName(e.target.value)}
        />
        <Input
          type="text"
          className=" w-full border border-gray-300 rounded px-3 py-2 mr-2"
          placeholder="Enter school location"
          value={schoolLocation}
          onChange={(e) => setSchoolLocation(e.target.value)}
        />
        <Button
          className={clsx(
            "w-full text-white",
            editMode
              ? "bg-green-500 hover:bg-green-700"
              : "bg-blue-500 hover:bg-blue-700"
          )}
          onClick={
            editMode ? () => handleEditOrUpdate(editSchoolId) : addSchool
          }
        >
          {editMode ? "Update" : "Add"} School
        </Button>
      </div>
      {/* Table to display list of schools */}
      <Table className="table-auto w-full">
        <TableHeader>
          <TableRow>
            <TableHead className="px-4 py-2">ID</TableHead>
            <TableHead className="px-4 py-2">School Name</TableHead>
            <TableHead className="px-4 py-2">Location</TableHead>
            <TableHead className="px-4 py-2">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {schools.map((school, index) => (
            <TableRow key={school._id}>
              <TableCell className="border-b px-4 py-2">{index + 1}</TableCell>
              <TableCell className="border-b px-4 py-2">
                {school.name}
              </TableCell>
              <TableCell className="border-b px-4 py-2">
                {school.location}
              </TableCell>
              <TableCell className="border-b px-4 py-2">
                <div className="">
                  <Button
                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-1 px-2 rounded mr-2"
                    onClick={() => handleEditOrUpdate(school?._id)}
                  >
                    {editMode && editSchoolId === school._id
                      ? "Cancel"
                      : "Edit"}
                  </Button>
                  <Button
                    className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-2 rounded"
                    onClick={() => deleteSchool(school?._id)}
                  >
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {schools.length === 0 && (
        <div className="flex justify-center items-center m-6 font-bold">
          No Record Found!
        </div>
      )}
    </div>
  );
};

export default AddNewSchool;

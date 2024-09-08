"use client"
import React, { useState } from 'react';

const SelectWithAddOption = () => {
  const [options, setOptions] = useState([
    'Option 1',
    'Option 2',
    'Option 3',
  ]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOption, setSelectedOption] = useState('');
  const [newOption, setNewOption] = useState('');

  // Filter options based on search term
  const filteredOptions = options.filter((option) =>
    option.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Add new option
  const handleAddNewOption = () => {
    if (newOption.trim()) {
      setOptions([...options, newOption]);
      setSelectedOption(newOption);
      setSearchTerm('');
      setNewOption('');
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4">Select or Add Option</h2>

      {/* Input for searching/selecting */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search or add a new option"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Dropdown list with options */}
      <ul className="border border-gray-300 rounded-md max-h-40 overflow-y-auto mb-4">
        {filteredOptions.length > 0 ? (
          filteredOptions.map((option, index) => (
            <li
              key={index}
              onClick={() => setSelectedOption(option)}
              className="p-2 hover:bg-blue-100 cursor-pointer"
            >
              {option}
            </li>
          ))
        ) : (
          <li className="p-2 text-gray-500">No results found.</li>
        )}
      </ul>

      {/* Show an option to add the search term as a new option */}
      {searchTerm && !filteredOptions.includes(searchTerm) && (
        <div>
          <button
            onClick={() => setNewOption(searchTerm)}
            className="bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Add "{searchTerm}" as a new option
          </button>
        </div>
      )}

      {/* Add new option input if triggered */}
      {newOption && (
        <div className="mt-4">
          <button
            onClick={handleAddNewOption}
            className="bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            Confirm Adding{newOption}
          </button>
        </div>
      )}

      {/* Display the selected option */}
      {selectedOption && (
        <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-md">
          Selected Option: {selectedOption}
        </div>
      )}
    </div>
  );
};

export default SelectWithAddOption;

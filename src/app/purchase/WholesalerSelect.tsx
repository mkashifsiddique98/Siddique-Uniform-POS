import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Select from 'react-select';
import { IWholesaler } from '@/models/wholesaler';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AddWholesalerForm } from './wholesaler/page';
import { customStyles } from './ProductSelect';

interface WholesalerSelectProps {
  onSelect: (wholesaler: IWholesaler) => void;
}

const WholesalerSelect: React.FC<WholesalerSelectProps> = ({ onSelect }) => {
  const [wholesalers, setWholesalers] = useState<IWholesaler[]>([]);
 

  useEffect(() => {
    const fetchWholesalers = async () => {
      const response = await axios.get("/api/purchase/wholesale");
      setWholesalers(response.data.listWholeSaler);
    };

    fetchWholesalers();
  }, []);

  const handleChange = (selectedOption: any) => {
    const selectedWholesaler = wholesalers.find((w) => w._id === selectedOption?.value);
    if (selectedWholesaler) {
      onSelect(selectedWholesaler);
    }
  };

  const options = wholesalers.map((wholesaler) => ({
    value: wholesaler._id,
    label: wholesaler.name
  }));
  const fetchWholesalers = async () => {
    try {
      const response = await axios.get("/api/purchase/wholesale");
      if (response) {
        setWholesalers(response.data.listWholeSaler);
        
      } else {
        setWholesalers([]);
      }
    } catch (error) {
      console.log("Message Error", error);
    }
  };

  useEffect(() => {
    fetchWholesalers();
  }, []);
  return (
    
        <div className='flex justify-between items-center'>
        <Select
        styles={customStyles}
        className='py-4 flex-1 mr-2'
        options={options}
        onChange={handleChange}
        placeholder="Select or search wholesaler..."
        isLoading={!options.length}
        isClearable
        isSearchable
      />
      <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className='p-6'>Add New WholeSaler</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
      <DialogTitle>Create WholeSaler</DialogTitle>
      <DialogDescription>
           Add new Wholesaler detail if not found in list 
          </DialogDescription>
        <AddWholesalerForm onAdd={fetchWholesalers} />
      </DialogContent>
      </Dialog>
    
    </div>
    
  );
}

export default WholesalerSelect;

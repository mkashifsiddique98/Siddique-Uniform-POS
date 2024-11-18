import React, { FC } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from '@/components/ui/input';
import { BadgeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ProductSelect from './ProductSelect';

interface ProductFormState {
  _id: string;
  productName: string;
  sellPrice: number;
  quantity: number;
}

interface BillProps {
  wholesaler: {
    name: string;
    location: string;
    phone: string;
    paymentStatus: string;
    pendingBalance: number;
  };
  products: ProductFormState[];
  onQuantityChange: (id: string, newQuantity: number) => void;
  onPriceChange: (id: string, newPrice: number) => void;
  handleDeletePurchaseId:(id:string)=>void;
  dataProducts: ProductFormState[];
  handleSelectProduct: ()=>void;
}

const Bill: FC<BillProps> = ({ wholesaler, products, onQuantityChange, onPriceChange,handleDeletePurchaseId,dataProducts,handleSelectProduct }) => {

  const handleQuantityChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10) || 0;
    onQuantityChange(id, newQuantity);
  };

  const handlePriceChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    onPriceChange(id, newPrice);
  };
 
  const totalAmount = products.reduce((sum, product) => sum + (product.sellPrice * (product.quantity || 0)), 0);

  return (
    <div className="my-4 p-4">
      <div className="border-b pb-1 mb-1 text-gray-800">
        <h2 className="text-xl font-semibold">Wholesaler Detail</h2>
        <div className='my-2'>
          <p><strong>Name: </strong> {wholesaler.name}</p>
          <p><strong>Location: </strong> {wholesaler.location}</p>
          <p><strong>Phone: </strong> {wholesaler.phone}</p>
          <p><strong>Payment Status:</strong> {wholesaler.paymentStatus}</p>
          <p><strong>Pending Balance:</strong> Rs {wholesaler.pendingBalance.toFixed(2)}</p>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No.</TableHead>
            <TableHead>Product Name</TableHead>
            <TableHead>Product Cost</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead className="text-right">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product._id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{product.productName}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  value={product.sellPrice || 1}
                  onChange={(e) => handlePriceChange(product._id, e)}
                  className="w-40"
                />
              </TableCell>
              <TableCell>
                <Input

                  type="number"
                  min="0"
                  value={product.quantity || 1}
                  onChange={(e) => handleQuantityChange(product._id, e)}
                  className="w-28"
                />
              </TableCell>
              <TableCell className="text-right">Rs {(product.sellPrice * (product.quantity || 0)).toFixed(2)}</TableCell>
              <TableCell className="text-right">
                <Button onClick={()=>handleDeletePurchaseId(product._id)}>
                  <BadgeX />
                </Button>

              </TableCell>
            </TableRow>
          ))}
          
        </TableBody>
        
        {/* <TableFooter>
          <TableRow>
            <TableCell colSpan={4} className="text-right font-semibold">Total Amount</TableCell>
            <TableCell className="text-right font-semibold">Rs {totalAmount.toFixed(2)}</TableCell>
          </TableRow>
        </TableFooter> */}
      </Table>
      <ProductSelect products={dataProducts} handleSelectProduct={handleSelectProduct} />
    </div>
  );
};

export default Bill;

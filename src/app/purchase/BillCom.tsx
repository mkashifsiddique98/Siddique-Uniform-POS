import React, { FC, useMemo } from 'react';
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
import { ProductFormState } from '@/types/product';

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
  handleDeletePurchaseId: (id: string) => void;
  dataProducts: ProductFormState[];
  handleSelectProduct: () => void;
}

const Bill: FC<BillProps> = ({
  wholesaler,
  products,
  onQuantityChange,
  onPriceChange,
  handleDeletePurchaseId,
  dataProducts,
  handleSelectProduct,
}) => {
  // Handle quantity change
  const handleQuantityChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuantity = parseInt(e.target.value, 10) || 0;
    onQuantityChange(id, newQuantity);
  };

  // Handle price change
  const handlePriceChange = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const newPrice = parseFloat(e.target.value) || 0;
    onPriceChange(id, newPrice);
  };

  // Memoized total amount calculation
  const totalAmount = useMemo(() => {
    return products.reduce(
      (sum, product) => sum + (product.productCost * (product.quantity || 0)),
      0
    );
  }, [products]);

  // Handle increment and decrement for quantity
  const handleIncrement = (id: string, quantity: number) => {
    onQuantityChange(id, quantity + 1);
  };

  const handleDecrement = (id: string, quantity: number) => {
    if (quantity > 0) {
      onQuantityChange(id, quantity - 1);
    }
  };

  return (
    <div className="my-4 p-4">
      <div className="border-b pb-1 mb-1 text-gray-800">
        <h2 className="text-xl font-semibold">Wholesaler Detail</h2>
        <div className="my-2">
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
          {products.map((product, index) => {
            const { _id, productName, productCost, quantity } = product;
            const total = (productCost || 0) * (quantity || 0);

            return (
              <TableRow key={_id || productName}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{productName}</TableCell>
                <TableCell>
                  <Input
                    type="number"
                    min="0"
                    value={productCost || 1}
                    onChange={(e) => handlePriceChange(_id, e)}
                    className="w-40"
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Button
                      onClick={() => handleDecrement(_id, quantity || 0)}
                      className="px-2 py-1 mr-2"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      min="0"
                      value={quantity || 0}
                      onChange={(e) => handleQuantityChange(_id, e)}
                      className="w-20 text-center"
                    />
                    <Button
                      onClick={() => handleIncrement(_id, quantity || 0)}
                      className="px-2 py-1 ml-2"
                    >
                      +
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-right">Rs {total.toFixed(2)}</TableCell>
                <TableCell className="text-right">
                  <Button onClick={() => handleDeletePurchaseId(_id)}>
                    <BadgeX />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <ProductSelect products={dataProducts} handleSelectProduct={handleSelectProduct} />
    </div>
  );
};

export default Bill;

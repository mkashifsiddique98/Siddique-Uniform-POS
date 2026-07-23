export interface Notification  {
  _id: any;
  type: 'low-stock' | 'due-date';
  message: string;
  productId?: string;
  invoiceId?: string;
  createdAt: Date;
  read: boolean;
}
export interface Notification  {
  type: 'low-stock' | 'due-date';
  message: string;
  productId?: string;
  invoiceId?: string;
  createdAt: Date;
  read: boolean;
}
export interface Utilize {
  _id: string;
  title: string;
  amount: number;
  category: { _id: string; name: string };
  paymentMethod: string;
  handledBy: string;
  note?: string;
  createdAt: string;
}

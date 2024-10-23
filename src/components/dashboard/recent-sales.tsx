import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Invoice } from "@/types/invoice"

export function RecentSales({InvoiceData}:{InvoiceData:Invoice[]}) {
 
  return (
    <div>
    {InvoiceData.slice(-7).map((invoice)=>(
      <div className="space-y-8 border-b mb-1 pb-1" key={invoice?._id}>
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="image/customer/wake-in-customer.jpg" alt="Avatar" />
          <AvatarFallback>{invoice?.customer?.customerName.slice(0,2)}</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">{invoice?.customer?.customerName}</p>
        </div>
        <div className="ml-auto font-medium">{invoice?.grandTotal}</div>
      </div>
    </div>
    ))}
     
    </div>
   
  )
}

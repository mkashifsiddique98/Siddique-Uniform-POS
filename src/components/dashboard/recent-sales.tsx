import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { invoice } from "@/types/invoice"

export function RecentSales({sale}) {
 console.log("response",sale)
  return (
    <div className="space-y-8">
      <div className="flex items-center">
        <Avatar className="h-9 w-9">
          <AvatarImage src="/avatars/01.png" alt="Avatar" />
          <AvatarFallback>WC</AvatarFallback>
        </Avatar>
        <div className="ml-4 space-y-1">
          <p className="text-sm font-medium leading-none">Walk in Customer</p>
          <p className="text-sm text-muted-foreground">
          WalkinCustomer@mail.com
          </p>
        </div>
        <div className="ml-auto font-medium">RS {}</div>
      </div>
    </div>
  )
}

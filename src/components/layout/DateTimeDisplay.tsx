"use client"
import { useEffect, useState } from "react";
<<<<<<< HEAD
import { formatShopDateTime } from "@/lib/formatTime";
=======
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07

// Date and Time for on Top bar 
const DateTimeDisplay: React.FC = () => {
  const [dateTime, setDateTime] = useState<Date | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    
      <div className="absolute inset-1/2 flex items-center justify-center transform -translate-x-1/2 -translate-y-1/2 font-extrabold -ml-10">
<<<<<<< HEAD
        <p className="text-sm font-extrabold whitespace-nowrap min-w-[20ch] text-center">
          {dateTime ? formatShopDateTime(dateTime) : ""}
=======
        <p className="text-sm font-extrabold whitespace-nowrap">
          {dateTime?.toLocaleDateString()} {dateTime?.toLocaleTimeString()}
>>>>>>> f8a20e95cc4d94a7877f73e654214fd1f0d81e07
        </p>
      </div>
  


  );
};
export default DateTimeDisplay
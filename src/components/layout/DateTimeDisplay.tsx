"use client"
import { useEffect, useState } from "react";

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
        <p className="text-sm font-extrabold whitespace-nowrap">
          {dateTime?.toLocaleDateString()} {dateTime?.toLocaleTimeString()}
        </p>
      </div>
  


  );
};
export default DateTimeDisplay
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
      <div className="absolute inset-0 flex items-center justify-center font-extrabold transform -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
        <p className="font-extrabold text-base">
          {dateTime?.toLocaleDateString()} {dateTime?.toLocaleTimeString()}
        </p>
      </div>
    );
  };
export default DateTimeDisplay
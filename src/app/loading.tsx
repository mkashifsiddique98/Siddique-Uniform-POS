import { Loader2 } from "lucide-react";
import React from "react";

const Loading = () => {
  return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="w-48 h-48 text-black animate-spin dark:text-gray-600" />
    </div>
  );
};

export default Loading;

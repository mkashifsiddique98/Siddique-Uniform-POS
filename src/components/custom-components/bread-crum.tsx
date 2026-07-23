import React, { FC } from "react";
import { Separator } from "../ui/separator";
interface BreadcurmProps {
  mainfolder: string;
  subfolder: string;
}
const BreadCrum: FC<BreadcurmProps> = ({ mainfolder, subfolder }) => {
  return (
    <div className="mb-2 pb-4 border-b">
      <h1 className="scroll-m-20 text-4xl font-semibold tracking-tight lg:text-3xl capitalize">
        {subfolder}&nbsp;&nbsp;
        <span className="text-sm font-medium tracking-tight">
          {mainfolder}&nbsp;|&nbsp;&nbsp;{subfolder}
        </span>
      </h1>
    </div>
  );
};

export default BreadCrum;

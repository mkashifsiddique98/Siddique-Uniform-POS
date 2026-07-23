"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

interface ZakatProps {
  data: {
    totalInventoryValue: number;
    totalReceivables: number;
    zakatBase: number;
    zakatPayable: number;
  };
}

export default function ZakatOverview({ data }: ZakatProps) {
  const chartData = [
    { name: "Inventory", amount: data.totalInventoryValue },
    { name: "Receivables", amount: data.totalReceivables },
    { name: "Zakat Base", amount: data.zakatBase },
    { name: "Zakat (2.5%)", amount: data.zakatPayable },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4 text-center">
        <div className="p-3 border rounded bg-slate-50">
          <p className="text-xs text-muted-foreground">Total Zakat Base</p>
          <p className="text-lg font-bold">Rs {data.zakatBase.toFixed(0)}</p>
        </div>
        <div className="p-3 border rounded bg-green-50 text-green-900">
          <p className="text-xs font-medium">Zakat Payable (2.5%)</p>
          <p className="text-xl font-extrabold">Rs {data.zakatPayable.toFixed(0)}</p>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} />
          <YAxis stroke="#888888" fontSize={12} tickLine={false} />
          <Tooltip formatter={(value: number) => [`Rs ${value.toFixed(0)}`, "Amount"]} />
          <Bar dataKey="amount" fill="#16a34a" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
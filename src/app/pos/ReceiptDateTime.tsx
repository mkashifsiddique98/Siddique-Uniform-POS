"use client";

import React, { useEffect, useState } from "react";
import { formatShopDateTime } from "@/lib/formatTime";

// The current time is client-only: the server renders an empty, fixed-width placeholder and the
// value is set after mount, so server and browser HTML always match. Only this small component
// re-renders on each tick, not the whole receipt.
const ReceiptDateTime: React.FC = () => {
  const [text, setText] = useState("");

  useEffect(() => {
    const update = () => setText(formatShopDateTime(new Date()));
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <span style={{ display: "inline-block", minWidth: "20ch", textAlign: "right" }}>{text}</span>
  );
};

export default ReceiptDateTime;

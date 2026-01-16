"use client";

import { Menu } from "lucide-react";

const MobileTopBar = ({ merchant }: { merchant: any }) => {
  return (
    <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-gray-200">
      <span className="font-bold">Abode</span>
      <button><Menu /></button>
    </div>
  );
};

export default MobileTopBar;

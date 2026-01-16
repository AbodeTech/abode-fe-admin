"use client";

import { Home, Search, User } from "lucide-react";

const MobileBottomTab = () => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around p-3 pb-safe z-50">
      <Home className="h-6 w-6" />
      <Search className="h-6 w-6" />
      <User className="h-6 w-6" />
    </div>
  );
};

export default MobileBottomTab;

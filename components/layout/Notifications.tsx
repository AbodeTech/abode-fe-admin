"use client";

import { Bell } from "lucide-react";

const Notifications = () => {
  return (
    <button className="p-2 text-[#808080] hover:text-[#222222] relative transition-colors">
      <Bell className="h-6 w-6" /> {/* Sized to match design */}
      <span className="absolute top-2 right-2 w-2 h-2 bg-[#D12630] rounded-full border border-white"></span>
    </button>
  );
};

export default Notifications;

"use client";

import { Button } from "@/components/ui/button";

const SubscriptionBadge = ({ subscription }: { subscription?: any }) => {
  // Design only as requested, ignoring subscription logic for now
  return (
    <Button
      size="sm"
      className="hidden md:flex bg-[#222222] text-white hover:bg-black/90 rounded-full px-4 h-9 text-xs font-medium border border-transparent shadow-none"
    >
      <span className="mr-2">🏆</span>
      Qart Partner
    </Button>
  );
};

export default SubscriptionBadge;

"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

type SidebarButtonProps = {
  name: string;
  link: string;
  active?: boolean;
  icon: React.ReactNode;
  soon?: boolean;
  action?: () => void;
};

const SidebarButton = ({
  name,
  link,
  active,
  icon,
  soon = false,
  action,
}: SidebarButtonProps) => {
  return (
    <Link
      onClick={action}
      href={soon ? "#" : link}
      className={`
        relative w-full px-4 py-3 h-10 flex items-center justify-start gap-3 rounded-xl cursor-pointer
        transition-all duration-200 ease-in-out
        ${active ? "bg-[#E6E6E6]" : "hover:bg-[#F0F0F0]"}
        ${soon ? "cursor-not-allowed pointer-events-none opacity-60" : ""}
      `}
    >
      <span className="transition-transform duration-200 group-hover:scale-105">
        {icon}
      </span>

      <span
        className={`text-sm transition-colors duration-200 ${active
            ? "text-[#222222] font-medium"
            : "text-[#8B8D98] hover:text-[#4C4C4C]"
          }`}
      >
        {name}
      </span>

      {soon && (
        <Image
          src="/images/comingsoon.svg"
          alt="Coming Soon"
          width={60}
          height={14}
          className="absolute right-2 top-1/2 -translate-y-1/2"
        />
      )}
    </Link>
  );
};

export default SidebarButton;

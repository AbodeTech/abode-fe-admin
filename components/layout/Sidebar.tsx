import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

import {
  ArrowDownToLine,
  BarChart3,
  Building2,
  ChevronRight,
  CircleDollarSign,
  FileText,
  Gift,
  LandPlot,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Percent,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  TrendingUp,
  Upload,
  UserPlus,
  Users,
} from "lucide-react";

import LogOutModal from "@/components/settings/LogOutModal";

// Mocking useNextStep
const useNextStep = () => ({ currentStep: null, currentTour: null });

// Grouped Navigation Items
const navGroups = [
  {
    title: "General",
    items: [
      { name: "Dashboard", link: "/", icon: <LayoutDashboard /> },
      { name: "Assets", link: "/assets", icon: <CircleDollarSign /> },
      { name: "Sales", link: "/admin/dashboard/sales", icon: <ShoppingCart /> },
      { name: "Users", link: "/admin/dashboard/users", icon: <Users /> },
      { name: "Allocation", link: "/admin/dashboard/allocation", icon: <Building2 /> },
    ]
  },
  {
    title: "Associates",
    isCollapsible: true,
    icon: <Users />,
    items: [
      { name: "Associates Upgrade", link: "/admin/dashboard/associate-upgrade", icon: <UserPlus /> },
      { name: "Top associates", link: "/admin/dashboard/top-associates/1", icon: <TrendingUp /> },
    ]
  },
  {
    title: "Transactions",
    isCollapsible: true,
    icon: <BarChart3 />,
    items: [
      { name: "Withdrawal", link: "/admin/dashboard/withdrawaltransaction", icon: <ArrowDownToLine /> },
      { name: "Topup", link: "/admin/dashboard/topuptransaction", icon: <Upload /> },
      { name: "Asset", link: "/admin/dashboard/assettransaction", icon: <BarChart3 /> },
      { name: "Document", link: "/admin/dashboard/documenttransaction", icon: <FileText /> },
      { name: "Commission", link: "/admin/dashboard/commissiontransaction", icon: <Percent /> },
    ]
  },
  {
    title: "Campaigns",
    isCollapsible: true,
    icon: <Gift />,
    items: [
      { name: "1000 Plots Project", link: "/admin/dashboard/1000plotsproject", icon: <LandPlot /> },
      { name: "Hamper Campaign", link: "/admin/dashboard/hampercampaign", icon: <Gift /> },
    ]
  },
  {
    title: "Security",
    isCollapsible: true,
    icon: <ShieldCheck />,
    items: [
      { name: "Admin Logs", link: "/admin/dashboard/adminlogs", icon: <ScrollText /> },
      { name: "Roles and Permissions", link: "/admin/dashboard/rolesandpermissions", icon: <ShieldCheck /> },
    ]
  }
];

const Sidebar = () => {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useUIStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "Transactions": false });

  const toggleGroup = (groupTitle: string) => {
    setOpenGroups(prev => ({ ...prev, [groupTitle]: !prev[groupTitle] }));
  };

  return (
    <div
      className={cn(
        "hidden-scrollbar bg-[#f5f5f5] flex flex-col h-screen sticky top-0 left-0 transition-all duration-300 ease-in-out border-r border-transparent",
        isSidebarCollapsed ? "w-[80px]" : "w-[260px]"
      )}
    >
      {/* Logo Area */}
      <div className={cn("h-20 flex items-center shrink-0", isSidebarCollapsed ? "justify-center" : "pl-6")}>
        {isSidebarCollapsed ? (
          <Image src="/favicon.ico" alt="Abode" width={32} height={32} className="block w-8 h-8 rounded-full" />
        ) : (
          <Image src="/logo.svg" alt="Abode" width={100} height={32} className="block w-auto h-8" />
        )}
      </div>

      {/* Navigation Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 ">
        {navGroups.map((group, groupIdx) => {
          const isGroupOpen = openGroups[group.title];

          // Special handling for collapsible groups ("Transactions")
          if (group.isCollapsible) {
            return (
              <div key={group.title}>
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={cn(
                    "flex items-center w-full p-2 mb-1 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors",
                    isSidebarCollapsed ? "justify-center" : "justify-between"
                  )}
                  title={isSidebarCollapsed ? group.title : undefined}
                >
                  <div className="flex items-center gap-3">
                    {React.cloneElement(group.icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5" })}
                    {!isSidebarCollapsed && <span className="font-medium text-sm">{group.title}</span>}
                  </div>
                  {!isSidebarCollapsed && <ChevronRight className={cn("h-4 w-4 transition-transform", isGroupOpen && "rotate-90")} />}
                </button>

                {/* Dropdown Items */}
                {(!isSidebarCollapsed && isGroupOpen) && (
                  <div className="ml-4 pl-2 border-l border-gray-200 space-y-1 mt-1">
                    {group.items.map(item => (
                      <Link
                        key={item.name}
                        href={item.link}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg text-sm transition-colors",
                          pathname === item.link ? "bg-[#E0F2F1] text-[#00695C] font-medium" : "text-gray-500 hover:text-gray-900"
                        )}
                      >
                        {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "h-4 w-4" })}
                        <span>{item.name}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          }

          // Normal Items
          return (
            <div key={groupIdx} className="space-y-1">
              {group.items.map(item => (
                <Link
                  key={item.name}
                  href={item.link}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg transition-colors group",
                    pathname === item.link ? "bg-[#E0F2F1] text-[#00695C] font-medium" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100",
                    isSidebarCollapsed && "justify-center"
                  )}
                  title={isSidebarCollapsed ? item.name : undefined}
                >
                  {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5 shrink-0" })}
                  {!isSidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              ))}
            </div>
          )
        })}
      </div>

      {/* Logout Area - Strictly at Bottom */}
      <div className="p-4 shrink-0 mt-auto">
        <button
          onClick={() => setIsLogoutModalOpen(true)}
          className={cn(
            "flex items-center gap-3 w-full p-2 rounded-lg text-[#AD1F2A] hover:bg-[#ffebe6] transition-colors",
            isSidebarCollapsed ? "justify-center" : ""
          )}
        >
          <LogOut className="h-5 w-5" />
          {!isSidebarCollapsed && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      <LogOutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
};

export default Sidebar;

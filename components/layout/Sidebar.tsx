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
  CheckCircle,
  ChevronRight,
  CircleDollarSign,
  ClipboardList,
  FileText,
  Gift,
  LandPlot,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Percent,
  ScrollText,
  Settings,
  ShieldCheck,
  ShoppingCart,
  Store,
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
      { name: "Sales", link: "/sales", icon: <ShoppingCart /> },
      { name: "Agency", link: "/agency", icon: <Building2 /> },
      { name: "Allocation", link: "/allocation", icon: <Building2 /> },
      { name: "Marketplace", link: "/marketplace", icon: <Store /> },
      { name: "Requests", link: "/requests", icon: <ClipboardList /> },
    ]
  },
  {
    title: "Users",
    isCollapsible: true,
    icon: <Users />,
    items: [
      { name: "All Users", link: "/users", icon: <Users /> },
      { name: "Default Users", link: "/users/defaults", icon: <ShieldCheck /> },
      { name: "Suspended Users", link: "/users/suspended", icon: <ShieldCheck /> },
      { name: "Suspended Payment Plans", link: "/users/suspended-payment-plans", icon: <ScrollText /> },
      { name: "Completed Asset Payments", link: "/users/completed-asset-payments", icon: <CheckCircle /> },
    ]
  },
  {
    title: "Associates",
    isCollapsible: true,
    icon: <Users />,
    items: [
      { name: "Associates Upgrade", link: "/associate-upgrade", icon: <UserPlus /> },
      { name: "Upgrade Coupons", link: "/associate-upgrade/coupons", icon: <Gift /> },
      { name: "Top associates", link: "/associates", icon: <TrendingUp /> },
      { name: "Manager Performance", link: "/associates/managers", icon: <ShieldCheck /> },
    ]
  },
  {
    title: "Transactions",
    isCollapsible: true,
    icon: <BarChart3 />,
    items: [
      { name: "Withdrawal", link: "/transactions/withdrawal", icon: <ArrowDownToLine /> },
      { name: "Topup", link: "/transactions/topup", icon: <Upload /> },
      { name: "Asset", link: "/transactions/assets", icon: <BarChart3 /> },
      { name: "Document", link: "/transactions/document", icon: <FileText /> },
      { name: "Commission", link: "/transactions/commission", icon: <Percent /> },
    ]
  },
  {
    title: "Campaigns",
    isCollapsible: true,
    icon: <Gift />,
    items: [
      { name: "1000 Plots Project", link: "/campaigns/1000plotsproject", icon: <LandPlot /> },
      { name: "2000 Associate Pro", link: "/campaigns/2000associateprocampaign", icon: <TrendingUp /> },
      { name: "Hamper Campaign", link: "/campaigns/hampercampaign", icon: <Gift /> },
    ]
  },
  {
    title: "Security",
    isCollapsible: true,
    icon: <ShieldCheck />,
    items: [
      { name: "Admin Logs", link: "/security/adminlogs", icon: <ScrollText /> },
      { name: "Roles and Permissions", link: "/security/roles", icon: <ShieldCheck /> },
    ]
  },
  {
    title: "Settings",
    isCollapsible: true,
    icon: <Settings />,
    items: [
      { name: "Commission Config", link: "/settings/commission-config", icon: <Percent /> },
    ]
  }
];

const Sidebar = () => {
  const pathname = usePathname();
  const { isSidebarCollapsed } = useUIStore();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ "Transactions": false, "Users": false });

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

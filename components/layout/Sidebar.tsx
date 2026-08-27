import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

import {
  Bot,
  Activity,
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
  Percent,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tags,
  Video,
  TrendingUp,
  Upload,
  UserCog,
  UserPlus,
  Users,
} from "lucide-react";

import LogOutModal from "@/components/settings/LogOutModal";
import { useAuthStore } from "@/store/auth-store";
import { useIsCurrentUserManager } from "@/features/associate-managers";

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
      { name: "Purchase Confirmations", link: "/purchase-confirmations", icon: <CheckCircle /> },
      { name: "Marketplace", link: "/marketplace", icon: <Store /> },
      { name: "Meetings", link: "/meetings", icon: <Video /> },
      { name: "Requests", link: "/requests", icon: <ClipboardList /> },
      { name: "Amaris", link: "/amaris", icon: <Bot /> },
      { name: "Flex Leads", link: "/flex-leads", icon: <UserPlus /> },
      { name: "Upgrade Coupons", link: "/associate-upgrade/coupons", icon: <Gift /> },
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
      { name: "Termination Payment Plans", link: "/users/suspended-payment-plans", icon: <ScrollText /> },
      { name: "Completed Asset Payments", link: "/users/completed-asset-payments", icon: <CheckCircle /> },
    ]
  },
  {
    title: "Associates",
    isCollapsible: true,
    icon: <Users />,
    items: [
      { name: "Associates Upgrade", link: "/associate-upgrade", icon: <UserPlus /> },
      { name: "Top associates", link: "/associates", icon: <TrendingUp /> },
      { name: "Associate Performance", link: "/associates/performance", icon: <Activity />, requiresSuperAdmin: true },
      { name: "Manager Performance", link: "/associates/managers", icon: <ShieldCheck />, requiresAdminOrManager: true },
    ]
  },
  {
    title: "Customer Success",
    isCollapsible: true,
    icon: <UserCog />,
    items: [
      { name: "CS Manager Performance", link: "/customer-managers", icon: <ShieldCheck /> },
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
      // "Payouts" rather than "Commission": this lists commission payout
      // transactions, and the Commission section below owns rates and overrides.
      { name: "Commission Payouts", link: "/transactions/commission", icon: <Percent /> },
    ]
  },
  {
    title: "Commission",
    isCollapsible: true,
    icon: <SlidersHorizontal />,
    items: [
      { name: "Rates", link: "/commission/rates", icon: <Percent /> },
      { name: "Overrides", link: "/commission/overrides", icon: <Tags /> },
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
  }
];

function getRouteOpenGroups(pathname: string): Record<string, boolean> {
  const open: Record<string, boolean> = {};
  const exactOwner = navGroups.some((group) =>
    group.items.some((item) => item.link === pathname)
  );

  for (const group of navGroups) {
    if (!group.isCollapsible) continue;
    const activeHere = group.items.some((item) => {
      if (pathname === item.link) return true;
      // Prefix match only when no other nav item owns this path exactly
      // (e.g. /associate-upgrade/coupons is a standalone General link).
      if (exactOwner) return false;
      return item.link.length > 1 && pathname.startsWith(`${item.link}/`);
    });
    if (activeHere) open[group.title] = true;
  }

  return open;
}

const Sidebar = () => {
  const pathname = usePathname();
  const { isSidebarCollapsed, isMobileNavOpen, closeMobileNav } = useUIStore();
  const { user } = useAuthStore();
  const { isManager } = useIsCurrentUserManager();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  /** Manual open/close overrides; cleared on navigation so route-driven opens win. */
  const [manualOpenGroups, setManualOpenGroups] = useState<Record<string, boolean>>({});
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setManualOpenGroups({});
  }

  const routeOpenGroups = getRouteOpenGroups(pathname);

  /** On mobile drawer, always show labels and nested links (collapsed desktop mode hides sub-routes). */
  const showNavDetails = !isSidebarCollapsed || isMobileNavOpen;
  const isGroupExpanded = (groupTitle: string) =>
    manualOpenGroups[groupTitle] ?? routeOpenGroups[groupTitle] ?? false;
  const showCollapsibleChildren = (groupTitle: string) =>
    isGroupExpanded(groupTitle) && showNavDetails;

  const toggleGroup = (groupTitle: string) => {
    setManualOpenGroups((prev) => ({
      ...prev,
      [groupTitle]: !(prev[groupTitle] ?? routeOpenGroups[groupTitle] ?? false),
    }));
  };

  // Close the mobile drawer when navigating.
  useEffect(() => {
    closeMobileNav();
  }, [pathname, closeMobileNav]);

  const isSuperAdmin = user?.role === "admin";

  // Strip out items the current user shouldn't see. Each gate is a small
  // predicate keyed off a flag on the item.
  const visibleNavGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const flags = item as {
          restrictedToRoles?: string[];
          requiresAdminOrManager?: boolean;
          requiresSuperAdmin?: boolean;
        };
        if (flags.requiresSuperAdmin) {
          return isSuperAdmin;
        }
        if (flags.requiresAdminOrManager) {
          return isSuperAdmin || isManager;
        }
        if (flags.restrictedToRoles) {
          return !!user?.role && flags.restrictedToRoles.includes(user.role);
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      id="dashboard-sidebar"
      className={cn(
        "hidden-scrollbar bg-[#f5f5f5] flex flex-col h-screen border-r border-transparent transition-[transform,width] duration-300 ease-in-out",
        isSidebarCollapsed && !isMobileNavOpen ? "w-[80px]" : "w-[260px]",
        "max-md:fixed max-md:left-0 max-md:top-0 max-md:z-60 max-md:max-w-[min(280px,100vw-2rem)] max-md:shadow-[4px_0_24px_rgba(0,0,0,0.12)]",
        isMobileNavOpen ? "max-md:translate-x-0" : "max-md:-translate-x-full",
        "md:sticky md:top-0 md:translate-x-0 md:shadow-none"
      )}
    >
      {/* Logo Area */}
      <div className={cn("h-20 flex items-center shrink-0", showNavDetails ? "pl-6" : "justify-center")}>
        {!showNavDetails ? (
          <Image src="/favicon.ico" alt="Abode" width={32} height={32} className="block w-8 h-8 rounded-full" />
        ) : (
          <Image src="/logo.svg" alt="Abode" width={100} height={32} className="block w-auto h-8" />
        )}
      </div>

      {/* Navigation Area */}
      <div className="flex-1 overflow-y-auto py-4 px-3 ">
        {visibleNavGroups.map((group, groupIdx) => {
          const isGroupOpen = isGroupExpanded(group.title);

          // Special handling for collapsible groups ("Transactions")
          if (group.isCollapsible) {
            return (
              <div key={group.title}>
                <button
                  onClick={() => toggleGroup(group.title)}
                  className={cn(
                    "flex items-center w-full p-2 mb-1 rounded-lg text-gray-500 hover:bg-gray-200 transition-colors",
                    showNavDetails ? "justify-between" : "justify-center"
                  )}
                  title={!showNavDetails ? group.title : undefined}
                >
                  <div className="flex items-center gap-3">
                    {React.cloneElement(group.icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5" })}
                    {showNavDetails && <span className="font-medium text-sm">{group.title}</span>}
                  </div>
                  {showNavDetails && <ChevronRight className={cn("h-4 w-4 transition-transform", isGroupOpen && "rotate-90")} />}
                </button>

                {/* Dropdown Items */}
                {showCollapsibleChildren(group.title) && (
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
                    !showNavDetails && "justify-center"
                  )}
                  title={!showNavDetails ? item.name : undefined}
                >
                  {React.cloneElement(item.icon as React.ReactElement<{ className?: string }>, { className: "h-5 w-5 shrink-0" })}
                  {showNavDetails && <span className="text-sm font-medium">{item.name}</span>}
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
            !showNavDetails && "justify-center"
          )}
        >
          <LogOut className="h-5 w-5" />
          {showNavDetails && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      <LogOutModal isOpen={isLogoutModalOpen} onClose={() => setIsLogoutModalOpen(false)} />
    </div>
  );
};

export default Sidebar;

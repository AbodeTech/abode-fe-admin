import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";

import {
  Activity,
  AlertOctagon,
  ArrowDownToLine,
  BarChart3,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  ClipboardList,
  Compass,
  FileText,
  Gem,
  Gauge,
  Gift,
  GraduationCap,
  HardHat,
  Inbox,
  Landmark,
  LandPlot,
  LayoutDashboard,
  MessageCircle,
  LogOut,
  Percent,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  SlidersHorizontal,
  Store,
  Tags,
  TrendingUp,
  Trophy,
  Upload,
  UserCog,
  UserPlus,
  Users,
  Video,
} from "lucide-react";

import LogOutModal from "@/components/settings/LogOutModal";
import { useAccessSubject } from "@/hooks/use-access";
import { useAuthStore } from "@/store/auth-store";
import { canAccess, getPage } from "@/lib/rbac";

// Grouped navigation. Presentation only: the group titles, their order and the
// icons live here. Each item names a page in the registry (lib/rbac/registry.ts),
// which owns its label, route and who may see it — so a new page is one registry
// entry and one line here, and no permission logic is repeated in this file.
const rawNavGroups: Array<{
  title: string;
  isCollapsible?: boolean;
  icon?: React.ReactElement;
  items: Array<{ id: string; icon: React.ReactElement }>;
}> = [
  {
    title: "General",
    items: [
      { id: "dashboard", icon: <LayoutDashboard /> },
      { id: "assets", icon: <CircleDollarSign /> },
      { id: "payment-plans", icon: <ScrollText /> },
      { id: "agency", icon: <Building2 /> },
      { id: "allocation", icon: <Building2 /> },
      { id: "marketplace", icon: <Store /> },
    ]
  },
  {
    title: "Sales",
    isCollapsible: true,
    icon: <ShoppingCart />,
    items: [
      { id: "sales", icon: <ShoppingCart /> },
      { id: "flex-leads", icon: <UserPlus /> },
    ]
  },
  {
    // ABO-5 — Meetings / Recruitment / Company Events as one Events group.
    title: "Events",
    isCollapsible: true,
    icon: <CalendarDays />,
    items: [
      { id: "meetings", icon: <Video /> },
      { id: "recruitment", icon: <GraduationCap /> },
      { id: "company-events", icon: <LandPlot /> },
    ]
  },
  {
    title: "Users",
    isCollapsible: true,
    icon: <Users />,
    items: [
      { id: "users", icon: <Users /> },
      { id: "users-suspended", icon: <ShieldCheck /> },
      { id: "users-completed-asset-payments", icon: <CheckCircle /> },
      // Standing lives under Users, not in a settings area: it is mostly read
      // as "who are my biggest landholders", and only occasionally edited.
      { id: "standing", icon: <Trophy /> },
    ]
  },
  {
    title: "Associates",
    isCollapsible: true,
    icon: <Users />,
    items: [
      { id: "upgrades", icon: <UserPlus /> },
      { id: "top-associates", icon: <TrendingUp /> },
      { id: "associate-performance", icon: <Activity /> },
      { id: "manager-performance", icon: <ShieldCheck /> },
      // Division sits with the associates rather than beside Portfolio Standing:
      // the two screens are built the same way, but this one is read as "how is
      // the sales floor doing this season", which is an associates question.
      { id: "division", icon: <Gem /> },
    ]
  },
  {
    title: "Academy",
    isCollapsible: true,
    icon: <GraduationCap />,
    items: [
      { id: "courses", icon: <GraduationCap /> },
      { id: "learners", icon: <Users /> },
    ]
  },
  {
    title: "Customer Success",
    isCollapsible: true,
    icon: <UserCog />,
    items: [
      { id: "cs-performance", icon: <ShieldCheck /> },
      { id: "tickets", icon: <Inbox /> },
      { id: "issues", icon: <AlertOctagon /> },
      { id: "purchase-confirmations", icon: <CheckCircle /> },
      { id: "requests", icon: <ClipboardList /> },
    ]
  },
  {
    title: "Amaris",
    isCollapsible: true,
    icon: <Bot />,
    items: [
      { id: "amaris", icon: <Bot /> },
      { id: "whatsapp", icon: <MessageCircle /> },
    ]
  },
  {
    title: "Finance",
    isCollapsible: true,
    icon: <Landmark />,
    items: [
      { id: "fo-performance", icon: <Gauge /> },
      { id: "finance-automation", icon: <ClipboardCheck /> },
      { id: "coupons", icon: <Gift /> },
    ]
  },
  {
    title: "Field Performance",
    isCollapsible: true,
    icon: <HardHat />,
    items: [
      { id: "field-site-managers", icon: <HardHat /> },
      { id: "field-surveyors", icon: <Compass /> },
      { id: "field-review-queue", icon: <ClipboardCheck /> },
    ]
  },
  {
    title: "Transactions",
    isCollapsible: true,
    icon: <BarChart3 />,
    items: [
      { id: "tx-withdrawal", icon: <ArrowDownToLine /> },
      { id: "tx-topup", icon: <Upload /> },
      { id: "tx-assets", icon: <BarChart3 /> },
      { id: "tx-document", icon: <FileText /> },
      // "Payouts" rather than "Commission": this lists commission payout
      // transactions, and the Commission section below owns rates and overrides.
      { id: "tx-commission", icon: <Percent /> },
    ]
  },
  {
    title: "Commission",
    isCollapsible: true,
    icon: <SlidersHorizontal />,
    items: [
      { id: "commission-rates", icon: <Percent /> },
      { id: "commission-overrides", icon: <Tags /> },
    ]
  },
  {
    title: "Campaigns",
    isCollapsible: true,
    icon: <Gift />,
    items: [
      { id: "campaigns", icon: <Gift /> },
      { id: "associate-pro-tracker", icon: <TrendingUp /> },
    ]
  },
  {
    title: "Security",
    isCollapsible: true,
    icon: <ShieldCheck />,
    items: [
      { id: "admin-logs", icon: <ScrollText /> },
      { id: "roles", icon: <ShieldCheck /> },
    ]
  }
];

/** Name and route come from the registry, so the two can never drift apart. */
const navGroups = rawNavGroups.map((group) => ({
  ...group,
  items: group.items.map((item) => {
    const page = getPage(item.id);
    if (!page) throw new Error(`Sidebar names a page the registry does not have: "${item.id}"`);
    return { id: item.id, name: page.label, link: page.route, icon: item.icon };
  }),
}));

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
      // (e.g. /associate-upgrade/coupons belongs to Finance, not Associates).
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
  const subject = useAccessSubject();
  const signedIn = useAuthStore((state) => !!state.user);
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

  // Strip out the pages this person may not open. Every page is judged by the
  // same registry rule the route guard uses, so the menu and the page agree.
  // Until the session is in memory nobody holds any permission, so only the pages open to
  // every admin would match: a menu of two items that then jumps to the real one. Show none.
  const visibleNavGroups = (signedIn ? navGroups : [])
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        const page = getPage(item.id);
        return !!page && canAccess(subject, page.access);
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

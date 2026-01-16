// Mocking icons using Lucide React to match the interface expected by the new Sidebar
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Truck,
  Users,
  Handshake,
  Wallet,
  Tag,
  Megaphone,
  Store,
  Banknote,
  LogOut,
  Settings,
} from "lucide-react";

export const DashboardIcon = ({ strokeColor, className }: any) => <LayoutDashboard color={strokeColor} className={className} size={20} />;
export const OrdersIcon = ({ strokeColor, className }: any) => <ShoppingCart color={strokeColor} className={className} size={20} />;
export const ProductIcon = ({ strokeColor, className }: any) => <Package color={strokeColor} className={className} size={20} />;
export const LogisticsIcon = ({ strokeColor, className }: any) => <Truck color={strokeColor} className={className} size={20} />;
export const CustomerIcon = ({ strokeColor, className }: any) => <Users color={strokeColor} className={className} size={20} />;
export const SuppliersIcon = ({ strokeColor, className }: any) => <Handshake color={strokeColor} className={className} size={20} />;
export const WalletIcon = ({ strokeColor, className }: any) => <Wallet color={strokeColor} className={className} size={20} />;
export const PricingIcon = ({ strokeColor, className }: any) => <Tag color={strokeColor} className={className} size={20} />;
export const MarketingIcon = ({ strokeColor, className }: any) => <Megaphone color={strokeColor} className={className} size={20} />;
export const StorefrontIcon = ({ strokeColor, className }: any) => <Store color={strokeColor} className={className} size={20} />;
export const LoanIcon = ({ strokeColor, className }: any) => <Banknote color={strokeColor} className={className} size={20} />;
export const LogoutIcon = ({ strokeColor, className }: any) => <LogOut color={strokeColor} className={className} size={20} />;
export const SettingsIcon = ({ strokeColor, className }: any) => <Settings color={strokeColor} className={className} size={20} />;

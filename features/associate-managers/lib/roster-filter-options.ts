/** URL `pro_group` values — must match backend `ProRosterGroup` enum. */
export const PRO_GROUP_OPTIONS = [
  { label: "All pros", value: "all" },
  { label: "Recruited this period", value: "recruited_in_period" },
  { label: "Upgraded this period", value: "upgraded_in_period" },
  { label: "Onboarded this period", value: "onboarded_in_period" },
  { label: "Selling this period", value: "selling_in_period" },
  { label: "Not yet onboarded", value: "recruited_not_onboarded" },
  { label: "Active", value: "active" },
  { label: "Inactive", value: "inactive" },
  { label: "Abandoned", value: "abandoned" },
] as const;

/** URL `pro_sort` values — must match backend `ProRosterSort` enum. */
export const PRO_SORT_OPTIONS = [
  { label: "Default order", value: "all" },
  { label: "Date recruited (newest)", value: "date_recruited_desc" },
  { label: "Last login (recent)", value: "last_login_desc" },
  { label: "Total sales (high)", value: "total_sales_desc" },
  { label: "Revenue (high)", value: "revenue_desc" },
  { label: "Onboarded (recent)", value: "onboarded_at_desc" },
] as const;

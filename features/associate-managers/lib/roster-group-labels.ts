import { ProRosterGroup } from "@/lib/gql/graphql";

export const GROUP_LABELS: Record<
  ProRosterGroup,
  { title: string; associateTitle: string; description: string }
> = {
  [ProRosterGroup.RecruitedInPeriod]: {
    title: "New Recruits This Period",
    associateTitle: "New Recruits This Period",
    description: "People who joined the roster during the selected period.",
  },
  [ProRosterGroup.UpgradedInPeriod]: {
    title: "Promoted to Associate Pro",
    associateTitle: "Promoted to Associate Pro",
    description: "Downline recruits who became associate pros in this period.",
  },
  [ProRosterGroup.OnboardedInPeriod]: {
    title: "Onboarded This Period",
    associateTitle: "Onboarded This Period",
    description: "Roster members with a successful onboarding call logged in this period.",
  },
  [ProRosterGroup.SellingInPeriod]: {
    title: "Selling Associate Pros",
    associateTitle: "Selling Associates",
    description:
      "Roster members who closed at least one new (initial) sale during the selected period.",
  },
  [ProRosterGroup.RecruitedNotOnboarded]: {
    title: "Onboarding Queue",
    associateTitle: "Onboarding Queue",
    description: "Recruited but no successful onboarding call has been logged yet.",
  },
  [ProRosterGroup.Active]: {
    title: "Active Associate Pros",
    associateTitle: "Active Associates",
    description: "Recently active based on login, sales, or recruiting activity.",
  },
  [ProRosterGroup.Inactive]: {
    title: "Inactive Associate Pros",
    associateTitle: "Inactive Associates",
    description: "Logged in before but no recent activity in the last 90 days.",
  },
  [ProRosterGroup.Abandoned]: {
    title: "Abandoned Associate Pros",
    associateTitle: "Abandoned Associates",
    description: "No login in the last 6 months.",
  },
};

export function getGroupLabel(
  group: ProRosterGroup,
  roster: "associate-pro" | "associate" = "associate-pro"
) {
  const entry = GROUP_LABELS[group];
  return roster === "associate" ? entry.associateTitle : entry.title;
}

export function getGroupDescription(group: ProRosterGroup) {
  return GROUP_LABELS[group].description;
}

/** Parse URL `open_group` into a valid enum value, or null. */
export function parseOpenGroupParam(value: string | null): ProRosterGroup | null {
  if (!value) return null;
  return Object.values(ProRosterGroup).includes(value as ProRosterGroup)
    ? (value as ProRosterGroup)
    : null;
}

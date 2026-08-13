export type FlexLeadType = "brochure" | "site_inspection";

export type FlexLeadStatus =
  | "new"
  | "contacted"
  | "scheduled"
  | "completed"
  | "closed";

export type FlexLeadRow = {
  id: string;
  type: FlexLeadType;
  fullName: string;
  email: string;
  phone: string;
  location: string | null;
  status: FlexLeadStatus;
  adminNotes: string | null;
  createdAt: string;
  updatedAt: string | null;
};

import { RequestListPage } from "@/features/requests";

export default function AssetUpdateRequestsPage() {
  return (
    <RequestListPage
      requestType="asset_update"
      description="Size and unit changes on an existing plan. ₦100,000 processing fee."
    />
  );
}

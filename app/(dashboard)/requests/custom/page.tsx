import { RequestListPage } from "@/features/requests";

export default function CustomRequestsPage() {
  return (
    <RequestListPage
      requestType="custom_request"
      description="Free-form requests — payment, documentation, property, technical or general. No fee."
    />
  );
}

import { RequestListPage } from "@/features/requests";

export default function DocumentChangeRequestsPage() {
  return (
    <RequestListPage
      requestType="document_change"
      description="Name and address corrections on issued documents. ₦20,000 processing fee."
    />
  );
}

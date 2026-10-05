import { getEnquiries } from "@/lib/actions/enquiries";
import { getPlans } from "@/lib/actions/plans";
import { EnquiryListClient } from "@/components/enquiries/EnquiryListClient";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  const [enquiries, plans] = await Promise.all([getEnquiries(), getPlans()]);
  return <EnquiryListClient enquiries={enquiries} plans={plans} />;
}

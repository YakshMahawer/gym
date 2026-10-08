import { getSessionUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { UploadClient } from "./UploadClient";

export const metadata = {
  title: "Data Migration | Superuser Portal",
  description: "Legacy ERP Excel migration and data transformation portal",
};

export default async function UploadPage() {
  const user = await getSessionUser();

  // Exclusively accessible by Superuser
  if (!user || user.role !== "SUPERUSER") {
    redirect("/portal");
  }

  return <UploadClient />;
}

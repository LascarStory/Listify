import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import ManageView from "./ManageView";

export default async function ManagePage({
  params,
}: {
  params: Promise<{ scheduleId: string }>;
}) {
  const session = await requireAdminSession();
  if (!session) {
    redirect("/");
  }

  const { scheduleId } = await params;
  return <ManageView scheduleId={scheduleId} />;
}

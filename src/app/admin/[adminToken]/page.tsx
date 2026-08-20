import AdminView from "./AdminView";

export default async function AdminPage({
  params,
}: {
  params: Promise<{ adminToken: string }>;
}) {
  const { adminToken } = await params;
  return <AdminView adminToken={adminToken} />;
}

import ShareView from "./ShareView";

export default async function SharePage({
  params,
}: {
  params: Promise<{ shareToken: string }>;
}) {
  const { shareToken } = await params;
  return <ShareView shareToken={shareToken} />;
}

import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ClientTransactionsRedirect({ params }: PageProps) {
  const { slug } = await params;
  redirect(`/portal/${slug}/trades`);
}

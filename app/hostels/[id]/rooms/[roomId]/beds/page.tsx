import { redirect } from "next/navigation";

type Props = {
  params: Promise<{
    id: string;
    roomId: string;
  }>;
};

export default async function BedsPage({ params }: Props) {
  const { id, roomId } = await params;

  redirect(`/hostels/${id}/rooms/${roomId}`);
}

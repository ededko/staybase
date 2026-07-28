import { prisma } from "@/lib/prisma";
import HostelCard from "@/components/hostels/HostelCard";
import CreateHostelButton from "@/components/hostels/CreateHostelButton";

export default async function HostelsPage() {
  const hostels = await prisma.hostel.findMany({
    include: {
      rooms: {
        include: {
          beds: {
            include: {
              resident: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">
            Хостели
          </h1>

          <p className="mt-2 text-slate-500">
            Усі ваші об&apos;єкти в одному місці
          </p>
        </div>

        <CreateHostelButton />
      </div>

      <div className="mt-8 grid gap-6">
        {hostels.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-10 text-center text-slate-500">
            Поки що немає жодного хостелу.
          </div>
        ) : (
          hostels.map((hostel) => (
            <HostelCard
              key={hostel.id}
              hostel={hostel}
            />
          ))
        )}
      </div>
    </div>
  );
}

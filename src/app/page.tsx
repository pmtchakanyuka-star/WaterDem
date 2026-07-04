import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { withUser } from "@/lib/db";
import GardenClient from "@/components/garden/GardenClient";
import { normalizePlant } from "@/lib/normalize";

export const dynamic = "force-dynamic";

export default async function GardenPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const plants = await withUser(session.userId, async (tx) => {
    const rows = await tx`
      select * from plants
      where owner_id = ${session.userId}
      order by created_at desc`;
    return rows.map(normalizePlant);
  });

  return (
    <GardenClient nickname={session.nickname} initialPlants={plants} />
  );
}

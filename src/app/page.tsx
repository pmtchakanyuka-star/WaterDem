import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { withUser } from "@/lib/db";
import GardenClient from "@/components/garden/GardenClient";
import { normalizePlant } from "@/lib/normalize";
import { coerceHomeSpaces } from "@/lib/home";

export const dynamic = "force-dynamic";

export default async function GardenPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { plants, homeSpaces } = await withUser(session.userId, async (tx) => {
    const plantRows = await tx`
      select * from plants
      where owner_id = ${session.userId}
      order by created_at desc`;
    const userRows = await tx`
      select home_spaces from users where id = ${session.userId}`;
    return {
      plants: plantRows.map(normalizePlant),
      homeSpaces: coerceHomeSpaces(userRows[0]?.home_spaces),
    };
  });

  return (
    <GardenClient
      nickname={session.nickname}
      initialPlants={plants}
      initialHomeSpaces={homeSpaces}
    />
  );
}

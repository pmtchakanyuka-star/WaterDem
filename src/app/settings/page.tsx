import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { withUser } from "@/lib/db";
import SettingsClient from "@/components/settings/SettingsClient";
import type { GardenShare, UserSettings } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const { user, shares } = await withUser(session.userId, async (tx) => {
    const users = await tx`
      select id, nickname, garden_is_public,
             location_lat, location_lon, location_label
      from users where id = ${session.userId}`;
    const shareRows = await tx`
      select gs.id, gs.viewer_id, u.nickname as viewer_nickname, gs.created_at
      from garden_shares gs
      join users u on u.id = gs.viewer_id
      where gs.owner_id = ${session.userId}
      order by gs.created_at desc`;
    return {
      user: users[0] as unknown as UserSettings,
      shares: shareRows as unknown as GardenShare[],
    };
  });

  return (
    <SettingsClient
      user={JSON.parse(JSON.stringify(user))}
      initialShares={JSON.parse(JSON.stringify(shares))}
    />
  );
}

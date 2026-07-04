import Link from "next/link";
import { Leaf, Lock, Sprout } from "lucide-react";
import { getSession } from "@/lib/session";
import { withUser } from "@/lib/db";
import PublicGardenGrid from "@/components/garden/PublicGardenGrid";
import type { Plant, UserPublic } from "@/lib/types";

export const dynamic = "force-dynamic";

/**
 * Read-only public garden. RLS does the gatekeeping: we query as the
 * visitor (their user id if signed in, anonymous otherwise) and render
 * whatever the plants_select policy lets through — is_public plants when
 * the garden is public or shared with the visitor. No edit affordances.
 */
export default async function PublicGardenPage({
  params,
}: {
  params: Promise<{ nickname: string }>;
}) {
  const { nickname } = await params;
  const session = await getSession();

  const result = await withUser(session?.userId ?? null, async (tx) => {
    const owners = await tx`
      select id, nickname, garden_is_public
      from users where lower(nickname) = lower(${decodeURIComponent(nickname)})`;
    const owner = owners[0] as unknown as UserPublic | undefined;
    if (!owner) return null;

    // RLS filters this to exactly what the visitor may see.
    const plants = await tx`
      select * from plants
      where owner_id = ${owner.id}
      order by created_at desc`;
    return { owner, plants: plants as unknown as Plant[] };
  });

  const isOwner = !!session && !!result && session.userId === result.owner.id;

  return (
    <main className="mx-auto flex min-h-dvh max-w-5xl flex-col gap-6 px-5 py-8 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-[rgba(110,231,168,0.25)] bg-[rgba(110,231,168,0.10)]">
            <Leaf className="size-5 text-sage" aria-hidden />
          </div>
          <div>
            <h1 className="font-display text-2xl leading-tight text-leaf-100">
              {result ? `${result.owner.nickname}'s garden` : "A quiet corner"}
            </h1>
            <p className="text-xs text-leaf-mut">
              {result && result.plants.length > 0
                ? `${result.plants.length} plant${result.plants.length === 1 ? "" : "s"} on display — just visiting`
                : "just visiting"}
            </p>
          </div>
        </div>
        <Link
          href={session ? "/" : "/login"}
          className="text-sm font-medium text-sage hover:underline"
        >
          {session ? "My garden" : "Grow your own"}
        </Link>
      </header>

      {!result || result.plants.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-5 py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-3xl border border-glass-edge bg-[rgba(255,255,255,0.05)]">
            {!result ? (
              <Sprout className="size-9 text-leaf-mut" aria-hidden />
            ) : (
              <Lock className="size-9 text-leaf-mut" aria-hidden />
            )}
          </div>
          <div>
            <h2 className="font-display text-3xl text-leaf-100">
              {!result ? "Nobody gardens here" : "This garden is private"}
            </h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-leaf-2nd">
              {!result
                ? "No gardener goes by that handle — check the link."
                : isOwner
                  ? "Visitors see nothing yet — mark some plants visible and flip the public switch in settings."
                  : "The gardener hasn't opened it up, or hasn't chosen any plants to show."}
            </p>
          </div>
        </div>
      ) : (
        <PublicGardenGrid plants={JSON.parse(JSON.stringify(result.plants))} />
      )}
    </main>
  );
}

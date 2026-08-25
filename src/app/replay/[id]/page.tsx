import Link from "next/link";
import { notFound } from "next/navigation";
import { ReplayExperience } from "@/components/replay-experience";
import { ShareButton } from "@/components/share-button";
import { getReplay, listReplays } from "@/lib/store/replay-store";

export function generateStaticParams() {
  return listReplays().map(({ id }) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const replay = getReplay(id);
  return replay ? {
    title: `${replay.route.name} · Walking Ocho`,
    description: `Watch the absurdly serious replay of ${replay.route.name}.`
  } : {};
}

export default async function ReplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const replay = getReplay(id);
  if (!replay) notFound();

  return (
    <>
      <div className="replay-utility">
        <Link href="/">← Replay desk</Link>
        <ShareButton title={replay.route.name} />
      </div>
      <ReplayExperience replay={replay} />
    </>
  );
}

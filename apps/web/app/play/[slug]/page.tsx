import { notFound } from "next/navigation";
import { fetchPlayBundleBySlug } from "../../../lib/play";
import { PlayClient } from "./PlayClient";

type Params = { params: { slug: string } };

export default async function PlayPage({ params }: Params) {
  const bundle = await fetchPlayBundleBySlug(params.slug);
  if (!bundle) notFound();
  return <PlayClient bundle={bundle} />;
}

export async function generateMetadata({ params }: Params) {
  const bundle = await fetchPlayBundleBySlug(params.slug);
  return {
    title: bundle?.venue.name ? `${bundle.venue.name} · Jackpot` : "Jackpot",
  };
}

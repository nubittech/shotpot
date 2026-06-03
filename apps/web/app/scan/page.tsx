import { getServerLocale } from "../../lib/i18n/server";
import { ScanClient } from "./ScanClient";

/**
 * Staff redemption panel. Locale is resolved on the server from the viewer's
 * language cookie — so the page renders in the right language immediately with
 * no EN→TR flash. The `venue` param is still passed through for redemption
 * scoping (security), just not for locale.
 */
export default function ScanPage({ searchParams }: { searchParams: { venue?: string } }) {
  const locale = getServerLocale();
  const venueSlug = searchParams.venue ?? null;
  return <ScanClient locale={locale} venueSlug={venueSlug} />;
}

import { notFound } from "next/navigation";
import ArtpFormalDocument from "@/app/dashboard/components/artp/ArtpFormalDocument";
import { verifyArtpPrintToken } from "@/lib/server/artpPrintToken";
import { loadArtpFormalDetailForPrint } from "@/lib/server/loadArtpFormalDetail";

export const dynamic = "force-dynamic";

export default async function ArtpPrintPage({
  params,
  searchParams,
}: {
  params: Promise<{ versionId: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { versionId } = await params;
  const { t } = await searchParams;
  if (!t || !verifyArtpPrintToken(versionId, t)) {
    notFound();
  }

  const loaded = await loadArtpFormalDetailForPrint(versionId);
  if (!loaded) notFound();

  return (
    <div className="bg-white text-gray-900 font-[family-name:var(--font-poppins)]">
      <ArtpFormalDocument
        organizationName={loaded.organizationName}
        organizationLogoUrl={loaded.organizationLogoUrl}
        detail={loaded.detail}
        issuedAt={
          loaded.detail.planning?.workContext?.workDate ??
          loaded.detail.version.publishedAt ??
          undefined
        }
      />
    </div>
  );
}

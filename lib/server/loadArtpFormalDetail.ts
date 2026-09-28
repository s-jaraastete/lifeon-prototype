import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ArtpVersionDetail, ArtpWorkerSignature } from "@/types/artp";
import { fetchAckSignaturePngBytes } from "@/lib/server/fetchAckSignaturePng";
import { fetchOrganizationDisplayName } from "@/lib/server/organizationDisplayName";
import { ORG_LOGOS_BUCKET, resolveOrganizationLogoUrl } from "@/lib/media/publicStorageUrl";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { parseArtpVersionDetail } from "@/lib/repositories/artpRepository";

function bytesToDataUrl(bytes: Uint8Array, mime: string): string {
  return `data:${mime};base64,${Buffer.from(bytes).toString("base64")}`;
}

function sniffImageMime(bytes: Uint8Array, hint: string): string {
  const lower = hint.toLowerCase();
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return "image/jpeg";
  if (bytes.length >= 6 && bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return "image/gif";
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46
  ) {
    return "image/webp";
  }
  if (lower.includes("png")) return "image/png";
  if (lower.includes("webp")) return "image/webp";
  if (lower.includes("svg")) return "image/svg+xml";
  if (lower.includes("gif")) return "image/gif";
  return "image/jpeg";
}

async function signatureDataUrl(
  client: SupabaseClient,
  storagePath: string | null | undefined
): Promise<string | null> {
  if (!storagePath?.trim()) return null;
  if (storagePath.startsWith("data:image/")) return storagePath;
  const bytes = await fetchAckSignaturePngBytes(client, storagePath);
  return bytes ? bytesToDataUrl(bytes, "image/png") : null;
}

async function organizationLogoDataUrl(
  client: SupabaseClient,
  organizationId: string
): Promise<string | null> {
  const { data: orgRow } = await client
    .from("organizations")
    .select("logo_url, logo_path")
    .eq("id", organizationId)
    .maybeSingle();

  const logoPath = typeof orgRow?.logo_path === "string" ? orgRow.logo_path : null;
  const logoUrl = resolveOrganizationLogoUrl(
    client,
    organizationId,
    typeof orgRow?.logo_url === "string" ? orgRow.logo_url : null,
    logoPath
  );

  if (logoUrl?.startsWith("data:image/")) return logoUrl;

  if (logoPath && !logoPath.startsWith("http")) {
    const { data: file, error } = await client.storage.from(ORG_LOGOS_BUCKET).download(logoPath);
    if (file && !error) {
      const bytes = new Uint8Array(await file.arrayBuffer());
      return bytesToDataUrl(bytes, sniffImageMime(bytes, logoPath));
    }
  }

  if (!logoUrl) return null;
  try {
    const res = await fetch(logoUrl, { cache: "no-store" });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    const hint = `${res.headers.get("content-type") ?? ""} ${logoUrl}`;
    return bytesToDataUrl(bytes, sniffImageMime(bytes, hint));
  } catch (error) {
    console.error("[artp-logo]", error);
    return null;
  }
}

type SignedDelivery = {
  assignee_member_id: string;
  signature_path: string | null;
  content_snapshot: { assigneeRole?: string } | null;
};

async function signedDeliveries(
  client: SupabaseClient,
  versionId: string
): Promise<SignedDelivery[]> {
  const { data } = await client
    .from("document_deliveries")
    .select("assignee_member_id, signature_path, content_snapshot")
    .eq("source_type", "artp")
    .eq("source_id", versionId)
    .eq("status", "firmado");
  return (data ?? []) as SignedDelivery[];
}

function deliveryPath(
  rows: SignedDelivery[],
  memberId: string | undefined,
  roles: string[]
): string | null {
  if (memberId) {
    const byMember = rows.find(
      (row) => row.assignee_member_id === memberId && row.signature_path
    );
    return byMember?.signature_path ?? null;
  }
  const byRole = rows.find((row) =>
    roles.includes(row.content_snapshot?.assigneeRole ?? "")
  );
  return byRole?.signature_path ?? null;
}

async function withSignatureImages(
  client: SupabaseClient,
  versionId: string,
  detail: ArtpVersionDetail
): Promise<ArtpVersionDetail> {
  if (!detail.planning) return detail;
  const deliveries = await signedDeliveries(client, versionId);
  const work = detail.planning.workContext;
  const supervisorPath =
    work.signatureStoragePath ||
    deliveryPath(deliveries, work.supervisorMemberId, ["supervisor", "worker_and_supervisor"]);
  const supervisorSignatureDataUrl =
    (work.supervisorSignatureDataUrl?.startsWith("data:image/")
      ? work.supervisorSignatureDataUrl
      : null) || (await signatureDataUrl(client, supervisorPath));

  const workers: ArtpWorkerSignature[] = await Promise.all(
    detail.planning.workers.map(async (worker) => {
      const path =
        worker.signatureStoragePath ||
        deliveryPath(deliveries, worker.memberId, ["worker", "worker_and_supervisor"]);
      const imageUrl =
        (worker.signatureDataUrl?.startsWith("data:image/") ? worker.signatureDataUrl : null) ||
        (await signatureDataUrl(client, path));
      return imageUrl ? { ...worker, signatureDataUrl: imageUrl } : worker;
    })
  );

  return {
    ...detail,
    planning: {
      ...detail.planning,
      workContext: {
        ...work,
        supervisorSignatureDataUrl,
      },
      workers,
    },
  };
}

export async function loadArtpFormalDetailForPrint(versionId: string): Promise<{
  organizationName: string;
  organizationLogoUrl: string | null;
  detail: ArtpVersionDetail;
} | null> {
  const admin = getSupabaseAdminClient();
  if (!admin) return null;

  const { data: ver } = await admin
    .from("artp_versions")
    .select(
      "id, version_number, status, task_name, content_hash, published_at, content_snapshot, artp_document_id, organization_id"
    )
    .eq("id", versionId)
    .maybeSingle();
  if (!ver) return null;

  const { data: doc } = await admin
    .from("artp_documents")
    .select("id, name, code, description")
    .eq("id", ver.artp_document_id)
    .maybeSingle();
  if (!doc) return null;

  const parsed = parseArtpVersionDetail({
    document: {
      id: doc.id,
      name: doc.name,
      code: doc.code,
      description: doc.description,
    },
    version: {
      id: ver.id,
      versionNumber: ver.version_number,
      status: ver.status,
      taskName: ver.task_name,
      contentHash: ver.content_hash,
      publishedAt: ver.published_at,
    },
    content: ver.content_snapshot,
  });
  if (!parsed) return null;

  const organizationId = String(ver.organization_id);
  const [organizationName, organizationLogoUrl, detail] = await Promise.all([
    fetchOrganizationDisplayName(admin, organizationId),
    organizationLogoDataUrl(admin, organizationId),
    parsed.planning ? withSignatureImages(admin, versionId, parsed) : Promise.resolve(parsed),
  ]);

  return { organizationName, organizationLogoUrl, detail };
}

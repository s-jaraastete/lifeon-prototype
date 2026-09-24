import { IrlInfoView } from "@/components/IrlInfoView";
import type { MemberContext, IrlMatrixEntry } from "@/types/models";

type Props = {
  entry: IrlMatrixEntry;
  member: MemberContext | null;
};

/** Vista informativa de Mi IRL (no documento formal). */
export function IrlDocumentScreen({ entry, member }: Props) {
  return <IrlInfoView entry={entry} member={member} />;
}

import { useLocalSearchParams } from "expo-router";
import { ArtpExecutionFlow } from "@/components/ArtpExecutionFlow";

export default function ArtpExecutionScreen() {
  const { executionId } = useLocalSearchParams<{ executionId: string }>();
  if (!executionId) return null;
  return <ArtpExecutionFlow executionId={executionId} />;
}

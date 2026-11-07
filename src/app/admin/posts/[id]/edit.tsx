import { useLocalSearchParams } from "expo-router";
import EditPostScreen from "@/screens/EditPostScreen";

export default function EditPostRoute() {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>();

  return <EditPostScreen from={from} id={id ?? ""} />;
}

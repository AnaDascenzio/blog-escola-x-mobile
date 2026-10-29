import { useLocalSearchParams } from "expo-router";
import EditPostScreen from "@/screens/EditPostScreen";

export default function EditPostRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <EditPostScreen id={id ?? ""} />;
}

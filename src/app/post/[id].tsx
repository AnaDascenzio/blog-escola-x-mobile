import { useLocalSearchParams } from "expo-router";
import PostDetailScreen from "@/screens/PostDetailScreen";

export default function PostRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <PostDetailScreen id={id ?? ""} />;
}
